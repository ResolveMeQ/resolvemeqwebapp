import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader, CheckCircle, X } from 'lucide-react';
import { api, TokenService } from '../services/api';
import Button from './ui/Button';
import ConfidenceBadge from './ui/ConfidenceBadge';

/**
 * SimpleTicketCreation - Dead simple ticket creation with IMMEDIATE AI response
 * 
 * User Flow:
 * 1. User describes issue in plain text
 * 2. Click "Get AI Help" 
 * 3. AI responds IMMEDIATELY with analysis & solution
 * 4. Conversation continues until resolved
 * 5. No hidden buttons, no confusion
 */
const SimpleTicketCreation = ({ onTicketCreated, onClose }) => {
  const [step, setStep] = useState('describe'); // describe, analyzing, conversation
  const [issueDescription, setIssueDescription] = useState('');
  const [ticket, setTicket] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    setStep('analyzing');

    try {
      const user = TokenService.getUser();
      
      // Create ticket
      const newTicket = await api.tickets.create({
        user: user?.id ?? user?.user_id,
        issue_type: issueDescription.substring(0, 100),
        description: issueDescription,
        category: determineCategory(issueDescription),
        status: 'new',
      });

      setTicket(newTicket);

      // IMMEDIATELY trigger AI processing
      await api.agent.processTicket(newTicket.id || newTicket.ticket_id, { force: true });

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get conversation history first
      const historyData = await api.agent.getChatHistory(newTicket.id || newTicket.ticket_id);
      
      if (historyData.conversation && historyData.conversation.messages.length > 0) {
        // Use existing conversation
        setConversationId(historyData.conversation.id);
        setConversation(historyData.conversation.messages.map(msg => ({
          type: msg.sender_type,
          text: msg.text,
          confidence: msg.confidence,
          metadata: msg.metadata,
          messageType: msg.message_type,
          wasHelpful: msg.was_helpful,
          timestamp: msg.created_at,
        })));
      } else {
        // Get AI response for the new ticket
        const agentStatus = await api.agent.getTicketAgentStatus(newTicket.id || newTicket.ticket_id);

        // Add AI's first response to conversation
        if (agentStatus.agent_processed) {
          const aiResponse = agentStatus.agent_response;
          setConversation([
            {
              type: 'user',
              text: issueDescription,
              timestamp: new Date().toISOString(),
            },
            {
              type: 'ai',
              text: generateWelcomeMessage(aiResponse),
              confidence: aiResponse.confidence,
              analysis: aiResponse.analysis,
              solution: aiResponse.solution,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          // Fallback if processing not complete
          setConversation([
            {
              type: 'user',
              text: issueDescription,
              timestamp: new Date().toISOString(),
            },
            {
              type: 'ai',
              text: "I'm analyzing your issue. Let me help you resolve this step by step. Can you provide more details about when this started?",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }

      setStep('conversation');
      onTicketCreated?.(newTicket);

    } catch (error) {
      console.error('Error creating ticket:', error);
      setConversation([
        {
          type: 'system',
          text: 'Sorry, there was an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
      setStep('describe');
    }
  };

  const sendMessage = async (textOverride = null) => {
    const messageText = textOverride ?? userInput;
    if (!messageText.trim() || !ticket) return;

    const userMessage = {
      type: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsAIThinking(true);

    try {
      const data = await api.agent.sendChatMessage(
        ticket.id || ticket.ticket_id,
        messageText,
        conversationId
      );

      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const aiMsg = data.ai_message;
      setConversation(prev => [
        ...prev,
        {
          type: 'ai',
          text: aiMsg.text,
          confidence: aiMsg.confidence,
          metadata: aiMsg.metadata,
          messageType: aiMsg.message_type,
          timestamp: aiMsg.created_at,
        },
      ]);

    } catch (error) {
      console.error('Chat error:', error);
      setConversation(prev => [
        ...prev,
        {
          type: 'system',
          text: 'Sorry, I had trouble processing that. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const determineCategory = (issue) => {
    const lower = (issue || '').toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet') || lower.includes('network')) return 'network';
    if (lower.includes('computer') || lower.includes('laptop') || lower.includes('printer')) return 'hardware';
    if (lower.includes('software') || lower.includes('app') || lower.includes('program')) return 'software';
    if (lower.includes('email') || lower.includes('outlook')) return 'email';
    return 'other';
  };

  const generateWelcomeMessage = (aiResponse) => {
    const { analysis, solution, confidence } = aiResponse;
    
    let message = `I've analyzed your issue. `;
    
    if (analysis?.priority === 'high') {
      message += `This looks urgent. `;
    }
    
    if (confidence >= 0.8) {
      message += `I'm confident I can help you resolve this. `;
    }
    
    if (solution?.steps && solution.steps.length > 0) {
      message += `\n\nHere's what I recommend:\n\n`;
      solution.steps.forEach((step, idx) => {
        message += `${idx + 1}. ${step}\n`;
      });
      message += `\n\nShall we try these steps together?`;
    } else {
      message += `Let me ask you a few questions to better understand the issue.`;
    }
    
    return message;
  };

  /** Trigger backend actions from AI suggested_actions (e.g. Auto Resolve, Escalate) */
  const handleSuggestedAction = async (actionLabel) => {
    const tid = ticket?.id || ticket?.ticket_id;
    if (!tid || actionInProgress) return;
    const action = String(actionLabel).toLowerCase();
    setActionInProgress(actionLabel);
    try {
      if (action.includes('resolve') && action.includes('auto')) {
        await api.tickets.updateStatus(tid, 'resolved');
        setConversation(prev => [...prev, {
          type: 'system',
          text: 'Ticket marked as resolved.',
          timestamp: new Date().toISOString(),
        }]);
        setTimeout(() => onClose?.(), 1500);
      } else if (action.includes('escalate')) {
        await api.tickets.escalate(tid);
        setConversation(prev => [...prev, {
          type: 'system',
          text: 'Ticket escalated to support.',
          timestamp: new Date().toISOString(),
        }]);
      } else if (action.includes('clarification')) {
        sendMessage('Could you provide more details about the issue?');
      } else {
        sendMessage(actionLabel);
      }
    } catch (err) {
      console.error('Suggested action failed:', err);
      setConversation(prev => [...prev, {
        type: 'system',
        text: 'Action could not be completed. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setActionInProgress(null);
    }
  };

  const markAsResolved = async () => {
    if (!ticket) return;
    try {
      await api.tickets.updateStatus(ticket.id || ticket.ticket_id, 'resolved');
      setConversation(prev => [
        ...prev,
        {
          type: 'system',
          text: '🎉 Great! Ticket marked as resolved. Thank you!',
          timestamp: new Date().toISOString(),
        },
      ]);
      setTimeout(() => onClose?.(), 2000);
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI IT Support</h2>
              <p className="text-primary-100 text-sm">Describe your issue, I'll help you fix it</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 'describe' && (
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What's the issue?
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Example: My printer won't connect to Wi-Fi..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Be as detailed as possible - I'll analyze it and help you fix it step by step
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!issueDescription.trim()}
                  className="w-full text-lg py-4"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get AI Help Now
                </Button>
              </form>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
                  <Loader className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  AI is analyzing your issue...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This usually takes 3-5 seconds
                </p>
              </div>
            </div>
          )}

          {step === 'conversation' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
                {conversation.map((msg, idx) => (
                  <div key={idx}>
                    {msg.type === 'ai' ? (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </p>
                            
                            {msg.confidence && (
                              <div className="mt-3">
                                <ConfidenceBadge confidence={msg.confidence} size="sm" />
                              </div>
                            )}

                            {/* Suggested actions: trigger backend (Auto Resolve, Escalate, etc.) */}
                            {msg.metadata?.suggested_actions?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Suggested actions:</p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.metadata.suggested_actions.map((action, aIdx) => (
                                    <button
                                      key={aIdx}
                                      type="button"
                                      onClick={() => handleSuggestedAction(action)}
                                      disabled={!!actionInProgress}
                                      className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-full text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick responses: send as chat message */}
                            {msg.metadata?.quick_replies?.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick responses:</p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.metadata.quick_replies.map((reply, rIdx) => (
                                    <button
                                      key={rIdx}
                                      type="button"
                                      onClick={() => sendMessage(reply.value)}
                                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                      {reply.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : msg.type === 'system' ? (
                      <div className="flex justify-center">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <div className="bg-primary-600 text-white rounded-xl px-4 py-3 max-w-[80%]">
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isAIThinking && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your response..."
                    disabled={isAIThinking}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!userInput.trim() || isAIThinking}
                    variant="primary"
                    size="md"
                    className="px-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ticket #{ticket?.id || ticket?.ticket_id}
                  </p>
                  <Button
                    onClick={markAsResolved}
                    variant="outline"
                    size="sm"
                    className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SimpleTicketCreation;
