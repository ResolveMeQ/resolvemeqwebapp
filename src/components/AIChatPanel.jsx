import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { api } from '../services/api';
import ConfidenceBadge from './ui/ConfidenceBadge';
import Button from './ui/Button';
import { cn } from '../utils/cn';
import {
  normalizeSuggestedActionsList,
  suggestedActionsFromAgentResponse,
  quickRepliesFromAgentResponse,
} from '../utils/chatUi';

/**
 * AIChatPanel - Real AI chat interface with backend integration
 * Features: Real-time chat, confidence scores, feedback, conversation history
 */
const AIChatPanel = ({ ticket, isOpen, onClose, onBackToTicket, onActionComplete, onTicketUpdate }) => {
  const ticketId = ticket?.id ?? ticket?.ticket_id;
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [typingElapsed, setTypingElapsed] = useState(0);
  const messagesEndRef = useRef(null);

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
  }, [isOpen, ticketId]);

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

  /** Build synthetic messages from ticket.agent_response when conversation is empty (e.g. from Describe flow) */
  const buildMessagesFromAgentResponse = (ticketData) => {
    const ar = ticketData?.agent_response;
    if (!ticketData?.agent_processed || !ar || typeof ar !== 'object') return null;
    const solution = ar.solution || {};
    const steps = solution.steps || solution.immediate_actions || [];
    const confidence = ar.confidence ?? 0.5;
    const reasoning = ar.reasoning || '';
    let aiText = '';
    if (Array.isArray(steps) && steps.length > 0) {
      if (steps.length === 1) {
        aiText = steps[0];
      } else if (steps.length <= 3) {
        aiText = "Here's what I suggest:\n\n" + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      } else {
        aiText = "Here are the first steps to try:\n\n" + steps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n');
        aiText += `\n\nThere are ${steps.length - 3} more steps. Would you like to see them?`;
      }
    } else {
      aiText = reasoning || "I've analyzed your issue and I'm here to help. Can you provide more details?";
    }
    const userText = ticketData.description || ticketData.issue_type || 'My issue';
    return [
      { id: `injected-user-${Date.now()}`, type: 'user', text: userText, createdAt: new Date().toISOString() },
      {
        id: `injected-ai-${Date.now()}`,
        type: 'ai',
        text: aiText,
        confidence,
        metadata: {
          steps: Array.isArray(steps) ? steps : [],
          suggested_actions: suggestedActionsFromAgentResponse(ar),
          estimated_time: solution.estimated_time,
          success_probability: solution.success_probability,
          quick_replies: quickRepliesFromAgentResponse(ar),
        },
        messageType: steps.length > 1 ? 'steps' : 'text',
        wasHelpful: null,
        createdAt: new Date().toISOString(),
      },
    ];
  };

  const loadConversationHistory = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const data = await api.agent.getChatHistory(ticketId);
      const conv = data.conversation || data;
      const convId = conv.id || data.id;
      const msgList = Array.isArray(conv.messages) ? conv.messages : (data.messages || []);
      
      if (convId) setConversationId(convId);
      if (msgList.length > 0) {
        setMessages(
          msgList.map((msg) => {
            const meta = msg.metadata || {};
            return {
              id: msg.id,
              type: msg.sender_type || msg.type,
              text: msg.text,
              confidence: msg.confidence,
              metadata: {
                ...meta,
                suggested_actions: normalizeSuggestedActionsList(meta.suggested_actions),
              },
              messageType: msg.message_type,
              wasHelpful: msg.was_helpful,
              createdAt: msg.created_at,
            };
          })
        );
      } else {
        // No messages: try to inject from ticket.agent_response (from process/Describe flow)
        let injected = false;
        try {
          const ticketData = await api.tickets.get(ticketId);
          const built = buildMessagesFromAgentResponse(ticketData);
          if (built?.length) {
            setMessages(built);
            injected = true;
          }
        } catch (_) {}
        if (!injected) {
          // Poll for agent_response when process may still be running (e.g. from Describe flow)
          const pollMs = 2000;
          const pollMax = 15000;
          let elapsed = 0;
          while (elapsed < pollMax) {
            await new Promise((r) => setTimeout(r, pollMs));
            elapsed += pollMs;
            try {
              const ticketData = await api.tickets.get(ticketId);
              const built = buildMessagesFromAgentResponse(ticketData);
              if (built?.length) {
                setMessages(built);
                injected = true;
                break;
              }
            } catch (_) {}
          }
        }
        if (!injected) startNewConversation();
      }
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

  const sendMessage = async (textOverride = null) => {
    const messageText = (textOverride || inputText || '').trim();
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
    setInputText('');
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

      // Add AI response to UI
      const aiMsg = data.ai_message;
      const meta = aiMsg.metadata || {};
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
          wasHelpful: null,
          createdAt: aiMsg.created_at,
        },
      ]);
      // Notify parent if ticket status changed (e.g. new→in_progress on first message)
      if (data.ticket_status && data.ticket_status !== (ticket?.status)) {
        onTicketUpdate?.({ ...ticket, status: data.ticket_status });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'system',
          text: 'Sorry, I had trouble processing that. The request may have timed out.',
          retryMessage: messageText,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitFeedback = async (messageId, helpful) => {
    // Optimistic update: show feedback state immediately so user knows their click worked
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, wasHelpful: helpful } : msg
      )
    );

    try {
      if (ticketId) {
        await api.agent.submitChatFeedback(ticketId, messageId, helpful);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleQuickReply = (reply) => {
    const value = reply.value ?? reply.message_text ?? reply.label;
    if (value && !isTyping) sendMessage(value);
  };

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
      try {
        if (intent === 'auto_resolve') {
          const res = await api.tickets.updateStatus(ticketId, 'resolved');
          onTicketUpdate?.(res?.ticket);
          setMessages((prev) => [...prev, {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: 'Ticket marked as resolved.',
            createdAt: new Date().toISOString(),
          }]);
          window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
          onActionComplete?.();
        } else if (intent === 'escalate') {
          const summary = buildConversationSummary();
          const res = await api.tickets.escalate(ticketId, summary ? { conversation_summary: summary } : {});
          onTicketUpdate?.(res?.ticket);
          setMessages((prev) => [...prev, {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: 'Ticket escalated to support.',
            createdAt: new Date().toISOString(),
          }]);
          window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
          onActionComplete?.();
        } else if (intent === 'request_clarification') {
          sendMessage(message || 'I need more information to proceed. Could you provide more details?');
        } else {
          sendMessage(message || label);
        }
      } catch (err) {
        console.error('Suggested action failed:', err);
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`,
          type: 'system',
          text: 'Action could not be completed. Please try again or get human help below.',
          createdAt: new Date().toISOString(),
        }]);
      } finally {
        setActionInProgress(null);
      }
      return;
    }

    const actionStr = String(action).toLowerCase();
    setActionInProgress(action);
    try {
      if (actionStr.includes('resolve') && (actionStr.includes('auto') || actionStr.includes('mark'))) {
        const res = await api.tickets.updateStatus(ticketId, 'resolved');
        onTicketUpdate?.(res?.ticket);
        setMessages((prev) => [...prev, {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: 'Ticket marked as resolved.',
          createdAt: new Date().toISOString(),
        }]);
        window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
        onActionComplete?.();
      } else if (actionStr.includes('escalate')) {
        const summary = buildConversationSummary();
        const res = await api.tickets.escalate(ticketId, summary ? { conversation_summary: summary } : {});
        onTicketUpdate?.(res?.ticket);
        setMessages((prev) => [...prev, {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: 'Ticket escalated to support.',
          createdAt: new Date().toISOString(),
        }]);
        window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
        onActionComplete?.();
      } else if (actionStr.includes('clarification')) {
        sendMessage('I need more information to proceed. Could you provide more details?');
      } else {
        sendMessage(String(action));
      }
    } catch (err) {
      console.error('Suggested action failed:', err);
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        type: 'system',
        text: 'Action could not be completed. Please try again or get human help below.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen || !ticketId) return null;

  return createPortal(
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      style={{ top: 0, right: 0, bottom: 0, height: '100vh' }}
      className="fixed w-full sm:max-w-2xl bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
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

      {/* Messages - Match app design */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
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
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        {/* Confidence badge + low-confidence hint for easier resolution path */}
                        {msg.confidence != null && (
                          <div className="mt-3 space-y-1">
                            <ConfidenceBadge
                              confidence={msg.confidence}
                              size="sm"
                            />
                            {msg.confidence < 0.6 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Confidence is low — you can still try the steps above, or choose &quot;Talk to a human&quot; to get support.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Steps: use metadata.steps or full_solution.steps for best resolution UX */}
                        {(() => {
                          const steps = msg.metadata?.steps ?? msg.metadata?.full_solution?.steps;
                          if (!steps || !Array.isArray(steps) || steps.length === 0) return null;
                          return (
                            <div className="space-y-2 mt-4">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Steps to follow:
                              </p>
                              {steps.map((step, stepIdx) => (
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
                      </div>

                      {/* Feedback buttons - users know their input leads to better help */}
                      {msg.wasHelpful === null && msg.type === 'ai' && (
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Was this helpful? Your feedback helps us suggest something different if needed.
                          </span>
                          <button
                            onClick={() => submitFeedback(msg.id, true)}
                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                            title="Yes, helpful"
                          >
                            <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
                          </button>
                          <button
                            onClick={() => submitFeedback(msg.id, false)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="No, I need different help"
                          >
                            <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                          </button>
                        </div>
                      )}

                      {msg.wasHelpful !== null && (
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
                    </div>
                  </div>
                ) : msg.type === 'system' ? (
                  <div className="flex justify-center my-4">
                    <div className={`rounded-lg px-4 py-3 flex flex-wrap items-center gap-2 max-w-md ${
                      msg.text && (msg.text.includes('trouble') || msg.text.includes('try again') || msg.text.includes('could not be completed'))
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                    }`}>
                      {msg.text && (msg.text.includes('trouble') || msg.text.includes('timed out') || msg.text.includes('try again') || msg.text.includes('could not be completed')) ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
                            {msg.text}
                          </p>
                          <div className="flex gap-2 w-full mt-2">
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
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {msg.text}
                          </p>
                        </>
                      )}
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
                    {typingElapsed >= 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
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
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your issue or ask a question..."
            disabled={isTyping || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || isTyping || isLoading}
            variant="primary"
            size="md"
            className="px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

export default AIChatPanel;
