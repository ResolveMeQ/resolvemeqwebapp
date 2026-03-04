import React, { useState, useEffect, useRef } from 'react';
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

/**
 * AIChatPanel - Real AI chat interface with backend integration
 * Features: Real-time chat, confidence scores, feedback, conversation history
 */
const AIChatPanel = ({ ticket, isOpen, onClose, onActionComplete }) => {
  const ticketId = ticket?.id ?? ticket?.ticket_id;
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const messagesEndRef = useRef(null);

  // Load conversation history on mount (ticket must exist first)
  useEffect(() => {
    if (isOpen && ticketId) {
      loadConversationHistory();
    }
  }, [isOpen, ticketId]);

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
      const convId = conv.id || data.id;
      const msgList = conv.messages || data.messages || [];
      
      if (convId && msgList.length >= 0) {
        setConversationId(convId);
        setMessages(
          (Array.isArray(msgList) ? msgList : []).map((msg) => ({
            id: msg.id,
            type: msg.sender_type || msg.type,
            text: msg.text,
            confidence: msg.confidence,
            metadata: msg.metadata || {},
            messageType: msg.message_type,
            wasHelpful: msg.was_helpful,
            createdAt: msg.created_at,
          }))
        );
      } else {
        // No history, start with welcome message
        startNewConversation();
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
      text: `Hi! I'm your AI assistant. I can help you resolve ticket #${ticketId}. What would you like to know?`,
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
    const messageText = textOverride || inputText;
    if (!messageText.trim()) return;

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
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsg.id,
          type: aiMsg.sender_type,
          text: aiMsg.text,
          confidence: aiMsg.confidence,
          metadata: aiMsg.metadata || {},
          messageType: aiMsg.message_type,
          wasHelpful: null,
          createdAt: aiMsg.created_at,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      // Show error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'system',
          text: 'Sorry, I had trouble processing that. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitFeedback = async (messageId, helpful) => {
    try {
      await api.agent.submitChatFeedback(ticketId, messageId, helpful);

      // Update UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, wasHelpful: helpful } : msg
        )
      );
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply.value);
  };

  /** Trigger backend actions from AI suggested_actions (e.g. Auto Resolve, Escalate) */
  const handleSuggestedAction = async (actionLabel) => {
    if (!ticketId || actionInProgress) return;
    const action = String(actionLabel).toLowerCase();
    setActionInProgress(actionLabel);
    try {
      if (action.includes('resolve') && action.includes('auto')) {
        await api.tickets.updateStatus(ticketId, 'resolved');
        setMessages((prev) => [...prev, {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: 'Ticket marked as resolved.',
          createdAt: new Date().toISOString(),
        }]);
        onActionComplete?.();
      } else if (action.includes('escalate')) {
        await api.tickets.escalate(ticketId);
        setMessages((prev) => [...prev, {
          id: `sys-${Date.now()}`,
          type: 'system',
          text: 'Ticket escalated to support.',
          createdAt: new Date().toISOString(),
        }]);
        onActionComplete?.();
      } else if (action.includes('clarification')) {
        sendMessage('I need more information to proceed. Could you provide more details?');
      } else {
        sendMessage(actionLabel);
      }
    } catch (err) {
      console.error('Suggested action failed:', err);
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        type: 'system',
        text: 'Action could not be completed. Please try again.',
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

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800"
    >
      {/* Header - Match ticket detail panel design */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="min-w-0 flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Ticket #{ticketId}</p>
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
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
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

                        {/* Confidence badge */}
                        {msg.confidence && (
                          <div className="mt-3">
                            <ConfidenceBadge
                              confidence={msg.confidence}
                              size="sm"
                            />
                          </div>
                        )}

                        {/* Steps message type */}
                        {msg.messageType === 'steps' && msg.metadata.steps && (
                          <div className="space-y-2 mt-4">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              Steps to follow:
                            </p>
                            {msg.metadata.steps.map((step, stepIdx) => (
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
                          </div>
                        )}

                        {/* Suggested Actions: trigger backend actions (Auto Resolve, Escalate, etc.) */}
                        {msg.metadata.suggested_actions?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                              Suggested actions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.metadata.suggested_actions.map((action, aIdx) => (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => handleSuggestedAction(action)}
                                  disabled={actionInProgress !== null}
                                  className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick replies: send as chat message */}
                        {msg.metadata.quick_replies?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              Quick responses:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.metadata.quick_replies.map((reply, rIdx) => (
                                <button
                                  key={rIdx}
                                  type="button"
                                  onClick={() => handleQuickReply(reply)}
                                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                  {reply.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Feedback buttons */}
                      {msg.wasHelpful === null && msg.type === 'ai' && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Was this helpful?
                          </span>
                          <button
                            onClick={() => submitFeedback(msg.id, true)}
                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
                          </button>
                          <button
                            onClick={() => submitFeedback(msg.id, false)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                          </button>
                        </div>
                      )}

                      {msg.wasHelpful !== null && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          {msg.wasHelpful ? (
                            <>
                              <ThumbsUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              <span className="text-xs text-green-600 dark:text-green-400">
                                Marked as helpful
                              </span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Feedback received
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : msg.type === 'system' ? (
                  <div className="flex justify-center my-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-4 py-3 flex items-center gap-2 max-w-md">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {msg.text}
                      </p>
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
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input - Match app design */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
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
    </motion.div>
  );
};

export default AIChatPanel;
