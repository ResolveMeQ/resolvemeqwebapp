import React, { useEffect, useState } from 'react';
import { MessageCircle, UserCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { extractHistoryMessageList } from '../utils/chatMessages';
import Button from './ui/Button';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Read-only preview of the ticket's AI chat thread (including human support replies).
 * Shown on the ticket detail panel so reporters and handlers do not have to hunt in AI Chat.
 */
const TicketChatPreview = ({ ticketId, ticket, refreshKey = 0, onOpenChat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.agent.getChatHistory(ticketId);
        if (cancelled) return;
        setMessages(extractHistoryMessageList(data));
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setError(err?.message || 'Could not load the conversation.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticketId, refreshKey]);

  const showPanel =
    loading ||
    messages.length > 0 ||
    ticket?.claimed_at ||
    ticket?.status === 'escalated' ||
    Boolean(error);

  if (!showPanel) return null;

  return (
    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          Conversation
        </p>
        {typeof onOpenChat === 'function' && (
          <Button variant="ghost" size="sm" onClick={onOpenChat}>
            Open AI Chat
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {ticket?.is_internal_request
          ? 'Messages with your teammate about this ticket. Open AI Chat to read the full thread or reply.'
          : 'Messages with the person who reported this ticket. Open AI Chat to read the full thread or reply.'}
      </p>

      {loading && messages.length === 0 ? (
        <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
      ) : error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No messages yet. Open AI Chat to continue this thread.
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const sender = msg.sender_type || msg.type;
            const isAgent = sender === 'agent';
            const isAi = sender === 'ai';
            const isUser = sender === 'user';
            return (
              <div
                key={msg.id}
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  isAgent
                    ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-900/10'
                    : isUser
                      ? 'border-primary-200 dark:border-primary-800/40 bg-primary-50/50 dark:bg-primary-900/10 ml-6'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1 text-gray-500 dark:text-gray-400">
                  {isAgent ? (
                    <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : isAi ? (
                    <Sparkles className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  ) : null}
                  <span>
                    {isAgent
                      ? msg.author_name || 'Support'
                      : isAi
                        ? 'AI assistant'
                        : 'Requester'}
                  </span>
                  {msg.created_at && (
                    <span className="font-normal normal-case text-gray-400 dark:text-gray-500 ml-auto">
                      {formatWhen(msg.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketChatPreview;
