import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  UserCheck,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { api, AgentQuotaExceededError, isAgentQuotaError, getApiErrorMessage } from '../services/api';
import Button from './ui/Button';
import ConfidenceBadge from './ui/ConfidenceBadge';
import { cn } from '../utils/cn';
import { resolveMediaUrl } from '../utils/media';
import {
  normalizeSuggestedActionsList,
} from '../utils/chatUi';
import {
  buildInitialChatMessages,
  buildSyntheticMessagesFromAgentResponse,
  extractHistoryMessageList,
  isEphemeralChatMessage,
} from '../utils/chatMessages';
import {
  IllustrationChatLoading,
  IllustrationChatWelcome,
  IllustrationChatError,
  IllustrationQuota,
} from './ui/ChatStateIllustrations';

/** Agent response_style values that use prose UI (no numbered repair steps / fake fix metrics). */
const PROSE_RESPONSE_STYLES = new Set([
  'informational',
  'clarification_only',
  'escalation_focus',
]);

const CHAT_TEXTAREA_MAX_H = 180;
const CHAT_COMPOSER_MIN_H = 44;

function screenshotVisionBanner(ticket) {
  if (!ticket?.screenshot) return null;
  const status = ticket?.agent_response?.screenshot_vision_status;
  if (!ticket?.agent_processed) {
    return {
      tone: 'pending',
      text: 'Screenshot attached — AI analysis in progress…',
    };
  }
  if (status?.loaded) {
    return {
      tone: 'success',
      text: 'Screenshot analyzed — the AI included your image in its assessment.',
    };
  }
  if (status?.attached && !status?.loaded) {
    return {
      tone: 'warning',
      text: 'Screenshot could not be read by the AI. Re-attach it with the button below.',
    };
  }
  return {
    tone: 'info',
    text: 'Screenshot on file — message the AI to ask what it sees, or re-attach to refresh.',
  };
}

const screenshotBannerToneClass = {
  success:
    'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200',
  warning:
    'border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
  pending:
    'border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200',
  info: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400',
};

/** Real priority/ETA from the escalate API response, instead of a hardcoded generic line. */
function escalationMessageFromResponse(res) {
  const eta = res?.eta;
  if (!eta?.eta_text) {
    return 'Escalated to human support. You’ll get updates here and by email when someone picks this up.';
  }
  const priority = (eta.priority || 'medium').toUpperCase();
  return `Escalated to human support (${priority} priority). Expect a response ${eta.eta_text}. You’ll get updates here and by email when someone picks this up.`;
}

/** Map agent response_style to ConfidenceBadge's plain-language mode. */
function confidenceModeFromResponseStyle(responseStyle) {
  if (responseStyle === 'informational') return 'informational';
  if (responseStyle === 'clarification_only') return 'clarification';
  if (responseStyle === 'escalation_focus') return 'escalation';
  return 'troubleshooting';
}

/**
 * Draft + auto-grow only re-render this chunk on each keypress, not the full message list
 * (fixes mobile jank when the chat thread is long).
 */
const AIChatComposer = React.memo(function AIChatComposer({ onSend, isTyping, isLoading }) {
  const [draft, setDraft] = useState('');
  const taRef = useRef(null);
  const rafId = useRef(0);

  const syncHeight = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      const el = taRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, CHAT_TEXTAREA_MAX_H)}px`;
    });
  }, []);

  useLayoutEffect(() => {
    syncHeight();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [draft, syncHeight]);

  const busy = isTyping || isLoading;
  const canSend = draft.trim().length > 0 && !busy;

  const doSend = () => {
    const t = draft.trim();
    if (!t || busy) return;
    onSend(t);
    setDraft('');
  };

  return (
    <div className="flex flex-1 gap-2 items-end min-w-0">
      <textarea
        ref={taRef}
        rows={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            doSend();
          }
        }}
        placeholder="Describe your issue or ask a question..."
        disabled={busy}
        aria-label="Message to AI assistant"
        className="flex-1 min-w-0 min-h-[44px] max-h-[180px] px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm resize-none overflow-y-auto touch-manipulation"
        style={{ minHeight: CHAT_COMPOSER_MIN_H, maxHeight: CHAT_TEXTAREA_MAX_H }}
        enterKeyHint="send"
        autoComplete="off"
        autoCorrect="on"
      />
      <Button
        onClick={doSend}
        disabled={!canSend}
        variant="primary"
        size="md"
        className="px-6 shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
});

/**
 * AIChatPanel - Real AI chat interface with backend integration
 * Features: Real-time chat, feedback, conversation history
 */
const AIChatPanel = ({
  ticket,
  isOpen,
  onClose,
  onBackToTicket,
  onActionComplete,
  onTicketUpdate,
  onAppToast,
  refreshKey = 0,
  /** When set, "Add context" / focus comments uses this instead of scrolling a global id (e.g. parent re-opens ticket detail). */
  onFocusComments,
  /** Optional: open parent “Request human help” modal instead of direct escalation. */
  onRequestHumanHelp,
}) => {
  const ticketId = ticket?.id ?? ticket?.ticket_id;
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [typingElapsed, setTypingElapsed] = useState(0);
  const [feedbackPrompts, setFeedbackPrompts] = useState([]);
  const [promptNonce, setPromptNonce] = useState(0);
  /** In-session dismissals when sessionStorage is unavailable or throws (private mode). */
  const [memoryDismissedPromptIds, setMemoryDismissedPromptIds] = useState(() => new Set());
  const [agentUsage, setAgentUsage] = useState(null);
  const [expandedStepMsgIds, setExpandedStepMsgIds] = useState({});
  const [revealedScriptMsgIds, setRevealedScriptMsgIds] = useState({});
  const [copiedScriptMsgId, setCopiedScriptMsgId] = useState(null);
  const [thinkingStage, setThinkingStage] = useState(0);
  const messagesEndRef = useRef(null);
  const liveRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const feedbackInFlightRef = useRef(new Set());
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState(null);

  const dismissedPromptStorageKey = (promptId) =>
    `resolvemeq_dismiss_feedback_prompt_${ticketId}_${promptId}`;

  const dismissTopFeedbackPrompt = (promptId) => {
    const pid = String(promptId ?? '');
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(dismissedPromptStorageKey(pid), '1');
      }
    } catch {
      /* private mode / quota — still hide via memory set */
    }
    setMemoryDismissedPromptIds((prev) => new Set(prev).add(pid));
    setPromptNonce((n) => n + 1);
  };

  const visibleFeedbackPrompts = useMemo(() => {
    return feedbackPrompts.filter((p) => {
      const pid = String(p.id ?? '');
      if (memoryDismissedPromptIds.has(pid)) return false;
      if (typeof sessionStorage === 'undefined') return true;
      try {
        const key = `resolvemeq_dismiss_feedback_prompt_${ticketId}_${pid}`;
        return !sessionStorage.getItem(key);
      } catch {
        return true;
      }
    });
  }, [feedbackPrompts, ticketId, promptNonce, memoryDismissedPromptIds]);

  const topFeedbackPrompt = visibleFeedbackPrompts[0];
  const screenshotBanner = useMemo(() => screenshotVisionBanner(ticket), [
    ticket?.screenshot,
    ticket?.agent_processed,
    ticket?.agent_response?.screenshot_vision_status,
  ]);

  // Show "Taking a moment..." after 5s of waiting for AI
  useEffect(() => {
    if (!isTyping) {
      setTypingElapsed(0);
      return;
    }
    const t = setTimeout(() => setTypingElapsed(5), 5000);
    return () => clearTimeout(t);
  }, [isTyping]);

  // Load conversation history on mount (ticket must exist first)
  useEffect(() => {
    if (isOpen && ticketId) {
      loadConversationHistory();
    }
  }, [isOpen, ticketId, refreshKey]);

  // Poll for new messages while the panel is open -- there's no push/WebSocket here.
  useEffect(() => {
    if (!isOpen || !ticketId) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.agent.getChatHistory(ticketId);
        const msgList = extractHistoryMessageList(data);
        if (!msgList.length) return;
        setMessages((prev) => {
          const ephemeral = prev.filter(isEphemeralChatMessage);
          const merged = buildInitialChatMessages(msgList, ticket);
          return [...merged, ...ephemeral].sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          );
        });
      } catch {
        // Best-effort -- a missed poll just means the user waits for the next tick.
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, ticketId, refreshKey, ticket]);

  useEffect(() => {
    setMemoryDismissedPromptIds(new Set());
  }, [ticketId]);

  // Situational follow-up prompts (resolution survey, escalation hint, etc.)
  useEffect(() => {
    if (!isOpen || !ticketId) return;
    let cancelled = false;
    api.agent
      .getFeedbackPrompts(ticketId)
      .then((data) => {
        if (cancelled) return;
        const list = data?.prompts ?? [];
        setFeedbackPrompts(Array.isArray(list) ? list : []);
      })
      .catch(() => setFeedbackPrompts([]));
    return () => {
      cancelled = true;
    };
  }, [isOpen, ticketId, ticket?.status]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    api.billing
      .getUsage()
      .then((u) => {
        if (!cancelled) setAgentUsage(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isTyping) {
      setThinkingStage(0);
      return;
    }
    const t0 = setTimeout(() => setThinkingStage(1), 2500);
    const t1 = setTimeout(() => setThinkingStage(2), 5500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [isTyping]);

  // Load contextual suggestions when chat is empty so users can start easily
  useEffect(() => {
    if (!isOpen || !ticketId || messages.length > 1) return;
    let cancelled = false;
    api.agent.getChatSuggestions(ticketId)
      .then((data) => {
        if (cancelled) return;
        const list = data?.suggestions ?? [];
        setSuggestions(Array.isArray(list) ? list.slice(0, 6) : []);
      })
      .catch(() => setSuggestions([]));
    return () => { cancelled = true; };
  }, [isOpen, ticketId, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const data = await api.agent.getChatHistory(ticketId);
      const conv = data.conversation || data;
      const convId = conv?.id || data.id;
      const msgList = extractHistoryMessageList(data);
      const initialRated =
        data.initial_solution_was_helpful ?? conv?.initial_solution_was_helpful ?? null;

      if (convId) setConversationId(convId);

      let ticketData = ticket;
      try {
        if (!ticketData?.agent_processed || (msgList.length > 0 && !msgList.some((m) => m.sender_type === 'user' || m.sender_type === 'ai'))) {
          ticketData = await api.tickets.get(ticketId);
        }
      } catch (_) {
        ticketData = ticket;
      }

      const initialMessages = buildInitialChatMessages(msgList, ticketData, initialRated);
      if (initialMessages.length > 0) {
        setMessages(initialMessages);
        return;
      }

      // Poll for agent_response when process may still be running (e.g. from Describe flow)
      let injected = false;
      const pollMs = 2000;
      let pollMax = 15000;
      const waitingForAnalysis = Boolean(ticketData && !ticketData.agent_processed);
      if (waitingForAnalysis) {
        pollMax = 60000;
        setAnalysisPending(true);
      }
      let elapsed = 0;
      while (elapsed < pollMax) {
        await new Promise((r) => setTimeout(r, pollMs));
        elapsed += pollMs;
        try {
          const freshTicket = await api.tickets.get(ticketId);
          let rated = initialRated;
          try {
            const gh = await api.agent.getChatHistory(ticketId);
            const historyMsgs = extractHistoryMessageList(gh);
            if (historyMsgs.length > 0) {
              setMessages(buildInitialChatMessages(historyMsgs, freshTicket, rated));
              injected = true;
              break;
            }
            rated =
              gh.initial_solution_was_helpful ??
              gh.conversation?.initial_solution_was_helpful ??
              rated;
          } catch (_) {}
          const built = buildSyntheticMessagesFromAgentResponse(freshTicket, rated);
          if (built?.length) {
            setMessages(built);
            injected = true;
            break;
          }
        } catch (_) {}
      }
      setAnalysisPending(false);
      if (!injected) startNewConversation();
    } catch (error) {
      console.error('Failed to load chat history:', error);
      startNewConversation();
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    const welcomeMessage = {
      id: `welcome-${Date.now()}`,
      type: 'ai',
      text: `Hi! I'm here to help you resolve this issue in the easiest way. Tell me what's going on or pick a suggestion below.`,
      wasHelpful: null,
      showFeedbackPrompt: false,
      metadata: {
        quick_replies: [
          { label: 'Analyze this ticket', value: 'Please analyze this ticket' },
          { label: 'Show solutions', value: 'Show me possible solutions' },
          { label: 'Similar tickets', value: 'Show similar resolved tickets' },
        ],
      },
    };
    setMessages([welcomeMessage]);
  };

  const SCREENSHOT_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
  const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;

  const handleScreenshotFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !ticketId) return;
    const okType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
    if (!okType) {
      onAppToast?.('Use JPEG, PNG, GIF, or WebP (max 5 MB).', 'error');
      return;
    }
    if (file.size > SCREENSHOT_MAX_BYTES) {
      onAppToast?.('Image too large (max 5 MB).', 'error');
      return;
    }
    setUploadingScreenshot(true);
    try {
      const data = await api.tickets.uploadAttachment(ticketId, file);
      if (data?.is_ticket_screenshot && data.file_url) {
        onTicketUpdate?.({ ...ticket, screenshot: data.file_url });
        onAppToast?.('Screenshot attached. Your next message can reference the image.', 'success');
      } else {
        onAppToast?.(data?.message || 'File uploaded.', 'info');
      }
    } catch (err) {
      const msg = err?.message || err?.detail;
      onAppToast?.(typeof msg === 'string' ? msg : 'Upload failed.', 'error');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const sendMessage = async (messageTextOrEmpty) => {
    const messageText = (messageTextOrEmpty != null ? String(messageTextOrEmpty) : '').trim();
    if (!messageText) return;
    if (isTyping) return; // Prevent double-send

    // Add user message to UI
    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // REAL API CALL TO BACKEND
      const data = await api.agent.sendChatMessage(
        ticketId,
        messageText,
        conversationId
      );

      // Save conversation ID from first response
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // When a human has claimed the ticket, the backend intentionally skips the AI
      // (see routed_to_human) -- there's no AI bubble to add, the customer's own
      // message above is the whole story until the agent replies.
      const aiMsg = data.ai_message;
      if (aiMsg) {
        const meta = aiMsg.metadata || {};
        const wh = aiMsg.was_helpful;
        const hidePrompt =
          aiMsg.show_feedback_prompt === false || wh != null;
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsg.id,
            type: aiMsg.sender_type,
            text: aiMsg.text,
            confidence: aiMsg.confidence,
            metadata: {
              ...meta,
              suggested_actions: normalizeSuggestedActionsList(meta.suggested_actions),
            },
            messageType: aiMsg.message_type,
            wasHelpful: wh ?? null,
            showFeedbackPrompt: hidePrompt ? false : aiMsg.sender_type === 'ai',
            createdAt: aiMsg.created_at,
            // The backend's own fallback message (AI unreachable) renders with the
            // same "Try again" affordance as a client-side error -- make sure it
            // resends the user's actual question, not the button's own label text.
            retryMessage: aiMsg.sender_type === 'system' ? messageText : undefined,
          },
        ]);
      } else if (data.routed_to_human) {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: 'Sent to support — a teammate is on this ticket and will reply here.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      // Notify parent if ticket status changed (e.g. new→in_progress on first message)
      if (data.ticket_status && data.ticket_status !== (ticket?.status)) {
        onTicketUpdate?.({ ...ticket, status: data.ticket_status });
        onAppToast?.(
          `Ticket updated: ${String(data.ticket_status).replace(/_/g, ' ')}.`,
          'info'
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof AgentQuotaExceededError || isAgentQuotaError(error)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `quota-${Date.now()}`,
            type: 'system',
            quotaExceeded: true,
            quotaDetail: error.detail,
            quotaUsed: error.agent_operations_used,
            quotaLimit: error.agent_operations_limit,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            type: 'system',
            text: 'We couldn’t get a reply from the AI right now (network or timeout). You can try again or get human help.',
            retryMessage: messageText,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const submitFeedback = async (messageId, helpful) => {
    const sid = String(messageId);
    if (feedbackInFlightRef.current.has(sid)) return;

    const isInjected = sid.startsWith('injected-ai');

    let previousWasHelpful = null;
    let previousShowPrompt = true;

    feedbackInFlightRef.current.add(sid);
    setFeedbackSubmittingId(sid);

    // Optimistic update: show feedback state immediately so user knows their click worked
    setMessages((prev) => {
      const t = prev.find((m) => m.id === messageId);
      if (t) {
        previousWasHelpful = t.wasHelpful ?? null;
        previousShowPrompt = t.showFeedbackPrompt !== false;
        if (t.wasHelpful === helpful) {
          return prev.map((msg) =>
            msg.id === messageId ? { ...msg, showFeedbackPrompt: false } : msg
          );
        }
      }
      return prev.map((msg) =>
        msg.id === messageId ? { ...msg, wasHelpful: helpful, showFeedbackPrompt: false } : msg
      );
    });

    try {
      if (!ticketId) return;
      if (isInjected) {
        const res = await api.agent.submitInitialSolutionFeedback(ticketId, helpful);
        if (res?.conversation_id) setConversationId(res.conversation_id);
      } else {
        const res = await api.agent.submitChatFeedback(ticketId, messageId, helpful);
        const saved = res?.was_helpful;
        if (typeof saved === 'boolean') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, wasHelpful: saved, showFeedbackPrompt: false }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                wasHelpful: previousWasHelpful,
                showFeedbackPrompt: previousShowPrompt,
              }
            : msg
        )
      );
      onAppToast?.('Could not save feedback. Try again.', 'error');
    } finally {
      feedbackInFlightRef.current.delete(sid);
      setFeedbackSubmittingId((current) => (current === sid ? null : current));
    }
  };

  const handleQuickReply = (reply) => {
    const value = reply.value ?? reply.message_text ?? reply.label;
    if (value && !isTyping) sendMessage(value);
  };

  const handleResolutionQuickConfirm = async (confirmed) => {
    if (!ticketId) return;
    try {
      await api.tickets.submitResolutionFeedback(ticketId, {
        resolution_confirmed: confirmed,
        satisfaction_score: confirmed ? 5 : 2,
        feedback_text: confirmed ? 'Quick confirmation from AI chat' : 'Quick no from AI chat',
      });
      setMessages((prev) => prev.filter((m) => !m.resolutionCheck));
      onTicketUpdate?.({
        ...ticket,
        status: confirmed ? 'resolved' : 'escalated',
      });
      onAppToast?.(
        confirmed
          ? 'Thanks — glad that worked!'
          : 'Thanks — we’ve noted it’s still an issue.',
        confirmed ? 'success' : 'info'
      );
      onActionComplete?.();
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
    } catch (e) {
      console.error(e);
      onAppToast?.('Could not save your answer. Try again.', 'error');
    }
  };

  const thinkingLabels = [
    'Reading your ticket and context…',
    'Searching knowledge and similar fixes…',
    'Drafting clear next steps…',
  ];

  /** Build a brief conversation summary for escalation (helps human agents) */
  const buildConversationSummary = () => {
    const relevant = messages.filter((m) => m.type === 'user' || m.type === 'ai').slice(-8);
    if (relevant.length === 0) return '';
    return relevant
      .map((m) => (m.type === 'user' ? `User: ${(m.text || '').slice(0, 150)}` : `AI: ${(m.text || '').slice(0, 150)}`))
      .join(' | ');
  };

  /** Trigger backend actions from AI suggested_actions ({ intent }) or legacy label strings */
  const handleSuggestedAction = async (action) => {
    if (!ticketId || actionInProgress) return;

    if (action && typeof action === 'object' && action.label) {
      const { intent, message, label } = action;
      const progressKey = label;
      setActionInProgress(progressKey);
      const prevStatus = ticket?.status;
      try {
        if (intent === 'auto_resolve') {
          const res = await api.tickets.updateStatus(ticketId, 'resolved');
          onTicketUpdate?.(res?.ticket);
          const sysId = `sys-${Date.now()}`;
          const checkId = `rescheck-${Date.now()}`;
          setMessages((prev) => [
            ...prev,
            {
              id: sysId,
              type: 'system',
              text: 'Ticket marked as resolved.',
              createdAt: new Date().toISOString(),
            },
            {
              id: checkId,
              type: 'system',
              resolutionCheck: true,
              createdAt: new Date().toISOString(),
            },
          ]);
          if (prevStatus !== 'resolved') {
            onAppToast?.('Ticket marked resolved.', 'success');
          }
          window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
          onActionComplete?.();
        } else if (intent === 'escalate') {
          const summary = buildConversationSummary();
          if (typeof onRequestHumanHelp === 'function') {
            onRequestHumanHelp(ticketId, { conversation_summary: summary || '' });
            setMessages((prev) => [...prev, {
              id: `sys-${Date.now()}`,
              type: 'system',
              text: 'Opening a support request form… add a short note so we can route this quickly.',
              createdAt: new Date().toISOString(),
            }]);
          } else {
            const res = await api.tickets.escalate(ticketId, summary ? { conversation_summary: summary } : {});
            onTicketUpdate?.(res?.ticket);
            setMessages((prev) => [...prev, {
              id: `sys-${Date.now()}`,
              type: 'system',
              text: escalationMessageFromResponse(res),
              createdAt: new Date().toISOString(),
            }]);
            onAppToast?.('Ticket escalated. Support will review it.', 'info');
            window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
            onActionComplete?.();
          }
        } else if (intent === 'request_clarification') {
          sendMessage(message || 'I need more information to proceed. Could you provide more details?');
        } else {
          sendMessage(message || label);
        }
      } catch (err) {
        console.error('Suggested action failed:', err);
        const msg = getApiErrorMessage(err, 'Action could not be completed. Please try again or get human help below.');
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`,
          type: 'system',
          text: msg,
          createdAt: new Date().toISOString(),
        }]);
        onAppToast?.(msg, 'error');
      } finally {
        setActionInProgress(null);
      }
      return;
    }

    const actionStr = String(action).toLowerCase();
    setActionInProgress(action);
    const prevStatus = ticket?.status;
    try {
      if (actionStr.includes('resolve') && (actionStr.includes('auto') || actionStr.includes('mark'))) {
        const res = await api.tickets.updateStatus(ticketId, 'resolved');
        onTicketUpdate?.(res?.ticket);
        const sysId = `sys-${Date.now()}`;
        const checkId = `rescheck-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: sysId,
            type: 'system',
            text: 'Ticket marked as resolved.',
            createdAt: new Date().toISOString(),
          },
          {
            id: checkId,
            type: 'system',
            resolutionCheck: true,
            createdAt: new Date().toISOString(),
          },
        ]);
        if (prevStatus !== 'resolved') {
          onAppToast?.('Ticket marked resolved.', 'success');
        }
        window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
        onActionComplete?.();
      } else if (actionStr.includes('escalate')) {
        const summary = buildConversationSummary();
        if (typeof onRequestHumanHelp === 'function') {
          onRequestHumanHelp(ticketId, { conversation_summary: summary || '' });
          setMessages((prev) => [...prev, {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: 'Opening a support request form… add a short note so we can route this quickly.',
            createdAt: new Date().toISOString(),
          }]);
        } else {
          const res = await api.tickets.escalate(ticketId, summary ? { conversation_summary: summary } : {});
          onTicketUpdate?.(res?.ticket);
          setMessages((prev) => [...prev, {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: escalationMessageFromResponse(res),
            createdAt: new Date().toISOString(),
          }]);
          onAppToast?.('Ticket escalated. Support will review it.', 'info');
          window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
          onActionComplete?.();
        }
      } else if (actionStr.includes('clarification')) {
        sendMessage('I need more information to proceed. Could you provide more details?');
      } else {
        sendMessage(String(action));
      }
    } catch (err) {
      console.error('Suggested action failed:', err);
      const msg = getApiErrorMessage(err, 'Action could not be completed. Please try again or get human help below.');
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        type: 'system',
        text: msg,
        createdAt: new Date().toISOString(),
      }]);
      onAppToast?.(msg, 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isOpen || !ticketId) return null;

  return createPortal(
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      style={{ top: 0, right: 0, bottom: 0, height: '100dvh', maxHeight: '100dvh' }}
      className="fixed w-full sm:max-w-2xl bg-white dark:bg-gray-950 shadow-2xl z-[60] flex flex-col border-l border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="min-w-0 flex items-center gap-3 flex-1">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate max-w-[200px]" title={ticket?.issue_type || ticket?.description || `Ticket #${ticketId}`}>
              {ticket?.issue_type || ticket?.description || `Ticket #${ticketId}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close AI Assistant"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {topFeedbackPrompt && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-amber-200/80 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/30">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {topFeedbackPrompt.title}
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mt-1">
                {topFeedbackPrompt.message}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {topFeedbackPrompt.cta_action === 'resolution_feedback' && (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  onClick={() => {
                    onClose?.();
                    setTimeout(() => {
                      document
                        .getElementById('resolution-feedback-section')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 250);
                  }}
                >
                  {topFeedbackPrompt.cta_label || 'Share feedback'}
                </button>
              )}
              {topFeedbackPrompt.cta_action === 'focus_comments' && (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-100/50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    if (onFocusComments) {
                      onFocusComments();
                      return;
                    }
                    onClose?.();
                    setTimeout(() => {
                      document
                        .getElementById('ticket-comments-section')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      document
                        .querySelector('#ticket-comments-section input[type="text"]')
                        ?.focus();
                    }, 400);
                  }}
                >
                  {topFeedbackPrompt.cta_label || 'Add context'}
                </button>
              )}
              {topFeedbackPrompt.cta_action === 'dismiss_only' && (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  onClick={() => dismissTopFeedbackPrompt(topFeedbackPrompt.id)}
                >
                  {topFeedbackPrompt.cta_label || 'Got it'}
                </button>
              )}
              <button
                type="button"
                className="text-xs text-amber-700/80 dark:text-amber-300/80 hover:underline"
                onClick={() => dismissTopFeedbackPrompt(topFeedbackPrompt.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Match app design (live region for new AI content) */}
      <div
        ref={liveRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-8 bg-gray-50 dark:bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 min-h-0 touch-pan-y"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center" role="status" aria-live="polite">
            <IllustrationChatLoading className="max-w-[200px]" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Loading your conversation</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fetching messages and context for this ticket.</p>
            </div>
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-600 border-t-transparent" aria-hidden />
          </div>
        ) : analysisPending ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center" role="status" aria-live="polite">
            <IllustrationChatLoading className="max-w-[200px]" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Analyzing your ticket</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The AI is reviewing your issue first — your chat will appear as soon as the analysis is ready.
              </p>
            </div>
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-600 border-t-transparent" aria-hidden />
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className="mb-4">
                {msg.type === 'ai' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {String(msg.id || '').startsWith('welcome-') && (
                        <div className="mb-3 flex flex-col items-center sm:items-start">
                          <IllustrationChatWelcome className="max-w-[160px] sm:max-w-[180px]" />
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 max-w-sm text-center sm:text-left">
                            Start here — describe the issue or use quick replies below.
                          </p>
                        </div>
                      )}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        {msg.confidence != null && (
                          <div className="mb-3">
                            <ConfidenceBadge
                              confidence={msg.confidence}
                              mode={confidenceModeFromResponseStyle(msg.metadata?.response_style)}
                              size="sm"
                            />
                          </div>
                        )}
                        {/*
                          Avoid duplicating content: Django/chat inject the same steps into `text` and metadata.steps.
                          When we render the numbered "Steps to follow" block below, skip the blob that repeats those steps.
                        */}
                        {(() => {
                          const stepList = msg.metadata?.steps ?? msg.metadata?.full_solution?.steps;
                          const dupSteps =
                            msg.messageType === 'steps' &&
                            Array.isArray(stepList) &&
                            stepList.length > 1;
                          if (dupSteps) {
                            return (
                              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                                Here are the steps to try. Expand below if there are more.
                              </p>
                            );
                          }
                          return (
                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          );
                        })()}

                        {/* Steps: use metadata.steps or full_solution.steps for best resolution UX */}
                        {(() => {
                          const steps = msg.metadata?.steps ?? msg.metadata?.full_solution?.steps;
                          if (!steps || !Array.isArray(steps) || steps.length === 0) return null;
                          const mid = msg.id;
                          const expanded = expandedStepMsgIds[mid] || steps.length <= 4;
                          const visible = expanded ? steps : steps.slice(0, 3);
                          return (
                            <div className="space-y-2 mt-4">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Steps to follow:
                              </p>
                              {visible.map((step, stepIdx) => (
                                <div
                                  key={stepIdx}
                                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary-600 dark:bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
                                    {stepIdx + 1}
                                  </span>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {step}
                                  </span>
                                </div>
                              ))}
                              {steps.length > 4 && (
                                <button
                                  type="button"
                                  className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                  onClick={() =>
                                    setExpandedStepMsgIds((prev) => ({
                                      ...prev,
                                      [mid]: !expanded,
                                    }))
                                  }
                                >
                                  {expanded
                                    ? 'Show fewer steps'
                                    : `Show all ${steps.length} steps`}
                                </button>
                              )}
                              {(msg.metadata?.estimated_time || msg.metadata?.success_probability != null) && (
                                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                                  {msg.metadata?.estimated_time && (
                                    <span>⏱ About {msg.metadata.estimated_time}</span>
                                  )}
                                  {msg.metadata?.success_probability != null && (
                                    <span>✓ {(msg.metadata.success_probability * 100).toFixed(0)}% success rate for similar issues</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Remediation script: exact copy-and-run commands, gated behind an explicit reveal click.
                            The user always runs it themselves — ResolveMeQ never executes it. */}
                        {(() => {
                          const rs = msg.metadata?.remediation_script;
                          if (!rs || !rs.script) return null;
                          const mid = msg.id;
                          const revealed = revealedScriptMsgIds[mid];
                          const platformLabel =
                            { windows: 'Windows', macos: 'macOS', linux: 'Linux' }[rs.platform] || rs.platform;
                          return (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-3">
                                <div className="flex items-center gap-2">
                                  <Terminal className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    {platformLabel} script available
                                  </p>
                                </div>
                                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1">
                                  {rs.summary}
                                </p>

                                {!revealed ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRevealedScriptMsgIds((prev) => ({ ...prev, [mid]: true }))
                                    }
                                    className="mt-3 px-3 py-2 min-h-[36px] text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                  >
                                    Show script
                                  </button>
                                ) : (
                                  <>
                                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-3 font-medium">
                                      Review this before running — you're responsible for running it on your device.
                                    </p>
                                    <pre className="mt-2 overflow-x-auto rounded-md bg-gray-900 text-gray-100 text-xs p-3 font-mono whitespace-pre-wrap break-words">
                                      <code>{rs.script}</code>
                                    </pre>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(rs.script);
                                          setCopiedScriptMsgId(mid);
                                          setTimeout(
                                            () => setCopiedScriptMsgId((cur) => (cur === mid ? null : cur)),
                                            2000
                                          );
                                        } catch {
                                          // clipboard unavailable — script is already visible to select/copy manually
                                        }
                                      }}
                                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      {copiedScriptMsgId === mid ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" /> Copy script
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Actions: click to resolve, escalate, or request clarification — not steps */}
                        {normalizeSuggestedActionsList(msg.metadata.suggested_actions).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                              What would you like to do?
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {normalizeSuggestedActionsList(msg.metadata.suggested_actions).map((act, aIdx) => (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => handleSuggestedAction(act)}
                                  disabled={actionInProgress !== null}
                                  className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionInProgress === act.label ? 'Working…' : act.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick replies: send as chat message to continue the conversation */}
                        {msg.metadata.quick_replies?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              Quick replies to send:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.metadata.quick_replies.map((reply, rIdx) => (
                                <button
                                  key={rIdx}
                                  type="button"
                                  disabled={isTyping}
                                  onClick={() => handleQuickReply(reply)}
                                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {reply.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources: KB articles the AI grounded this answer in */}
                        {msg.metadata?.kb_article_citations?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Sources
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {msg.metadata.kb_article_citations.map((citation, cIdx) => (
                                <Link
                                  key={citation.kb_id ?? cIdx}
                                  to={`/knowledge-base?kb=${encodeURIComponent(citation.kb_id)}`}
                                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline truncate"
                                  title={citation.title}
                                >
                                  📄 {citation.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Feedback buttons — hidden after rating (or when showFeedbackPrompt is false) */}
                      {msg.type === 'ai' &&
                        msg.wasHelpful == null &&
                        msg.showFeedbackPrompt !== false && (
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Was this helpful? Your feedback helps us suggest something different if needed.
                          </span>
                          <button
                            type="button"
                            onClick={() => submitFeedback(msg.id, true)}
                            disabled={feedbackSubmittingId === String(msg.id)}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:pointer-events-none"
                            title="Yes, helpful"
                            aria-label="Mark as helpful"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                submitFeedback(msg.id, true);
                              }
                            }}
                          >
                            <ThumbsUp className="w-5 h-5 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => submitFeedback(msg.id, false)}
                            disabled={feedbackSubmittingId === String(msg.id)}
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none"
                            title="No, I need different help"
                            aria-label="Mark as not helpful"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                submitFeedback(msg.id, false);
                              }
                            }}
                          >
                            <ThumbsDown className="w-5 h-5 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                          </button>
                        </div>
                      )}

                      {msg.type === 'ai' && msg.wasHelpful != null && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10 rounded-lg px-3 py-2 -mx-1">
                          {msg.wasHelpful ? (
                            <>
                              <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Thank you! Marked as helpful
                              </span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" />
                              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                Thank you! We'll suggest something different next time
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {msg.type === 'ai' && msg.wasHelpful === false && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isTyping}
                            onClick={() => sendMessage('The previous suggestions did not work. What else can I try?')}
                            className="px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            Try different steps
                          </button>
                          <button
                            type="button"
                            disabled={isTyping || actionInProgress}
                            onClick={() => handleSuggestedAction({ label: 'Talk to a human', intent: 'escalate' })}
                            className="px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-900/50 disabled:opacity-50"
                          >
                            Talk to a human
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : msg.type === 'system' ? (
                  <div className="flex justify-center my-4">
                    {msg.resolutionCheck ? (
                      <div className="rounded-lg px-4 py-3 max-w-md w-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50">
                        <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                          Did that fix your issue?
                        </p>
                        <p className="text-xs text-primary-800/85 dark:text-primary-200/80 mt-1">
                          Quick yes/no — you can add more detail in the feedback section on the ticket anytime.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            className="px-4 py-2 min-h-[44px] text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                            onClick={() => handleResolutionQuickConfirm(true)}
                          >
                            Yes, it’s fixed
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 min-h-[44px] text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleResolutionQuickConfirm(false)}
                          >
                            Not yet
                          </button>
                        </div>
                      </div>
                    ) : msg.quotaExceeded ? (
                      <div className="rounded-lg px-4 py-4 max-w-md w-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
                        <IllustrationQuota className="max-w-[100px] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100">AI agent quota reached</p>
                          <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                            {msg.quotaDetail || 'You have used all AI agent operations for this billing period.'}
                          </p>
                          {msg.quotaUsed != null && msg.quotaLimit != null && (
                            <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-2">
                              {msg.quotaUsed} / {msg.quotaLimit} operations used this period
                            </p>
                          )}
                          <Link
                            to="/billing"
                            className="inline-block mt-3 text-sm font-semibold text-red-800 dark:text-red-200 underline underline-offset-2"
                          >
                            View billing and upgrade your plan
                          </Link>
                        </div>
                      </div>
                    ) : (
                    <div className={`rounded-lg px-4 py-3 max-w-md ${
                      msg.text && (msg.text.includes('trouble') || msg.text.includes('try again') || msg.text.includes('could not be completed'))
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 flex flex-wrap items-center gap-2'
                    }`}>
                      {msg.text && (msg.text.includes('trouble') || msg.text.includes('timed out') || msg.text.includes('try again') || msg.text.includes('could not be completed')) ? (
                        <div className="w-full space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <IllustrationChatError className="max-w-[88px] shrink-0 mx-auto sm:mx-0 hidden sm:block" />
                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mx-auto sm:hidden" aria-hidden />
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                                Something went wrong
                              </p>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                                {msg.text}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => sendMessage(msg.retryMessage || 'Please try again')}
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 disabled:opacity-50"
                            >
                              Try again
                            </button>
                            <button
                              type="button"
                              onClick={() => sendMessage('I need to speak with support staff')}
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Get human help
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {msg.text}
                          </p>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                ) : msg.type === 'agent' ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1.5">
                          {msg.authorName || 'Support'}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-primary-600 text-white rounded-lg px-4 py-3 max-w-[75%] shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2" aria-live="polite">
                      {thinkingLabels[thinkingStage]}
                    </p>
                    {typingElapsed >= 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Taking a moment — complex issues can take up to 30 seconds.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input and contextual suggestions for easiest path to resolution */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-950 flex-shrink-0">
        {agentUsage &&
          agentUsage.agent_operations_unlimited === false &&
          agentUsage.agent_operations_limit != null && (
            <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mb-2">
              AI this month: {agentUsage.agent_operations_used ?? 0} / {agentUsage.agent_operations_limit}{' '}
              <Link to="/billing" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
                Billing
              </Link>
            </p>
          )}
        {suggestions.length > 0 && messages.length <= 1 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick options:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.id || s.label}
                  type="button"
                  onClick={() => sendMessage(s.message_text || s.label)}
                  disabled={isTyping || isLoading}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {ticket?.screenshot && screenshotBanner && (
          <div
            className={cn(
              'mb-2 flex items-center gap-2 rounded-lg border px-2 py-1.5',
              screenshotBannerToneClass[screenshotBanner.tone] || screenshotBannerToneClass.info
            )}
          >
            <img
              src={resolveMediaUrl(ticket.screenshot)}
              alt="Ticket screenshot"
              className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-600 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="text-[11px] leading-snug">{screenshotBanner.text}</p>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={screenshotInputRef}
            type="file"
            accept={SCREENSHOT_ACCEPT}
            className="hidden"
            tabIndex={-1}
            onChange={handleScreenshotFile}
          />
          <Button
            type="button"
            onClick={() => screenshotInputRef.current?.click()}
            disabled={isTyping || isLoading || analysisPending || uploadingScreenshot || !ticketId}
            variant="secondary"
            size="md"
            className="px-3 shrink-0 min-h-[44px]"
            aria-label="Attach screenshot"
            title="Attach screenshot (JPEG, PNG, GIF, WebP, max 5 MB)"
          >
            <ImagePlus className={`w-4 h-4 ${uploadingScreenshot ? 'opacity-50' : ''}`} />
          </Button>
          <AIChatComposer onSend={sendMessage} isTyping={isTyping} isLoading={isLoading || analysisPending} />
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

export default AIChatPanel;
