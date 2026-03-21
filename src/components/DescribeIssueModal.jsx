import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Loader } from 'lucide-react';
import { api, TokenService } from '../services/api';
import Button from './ui/Button';

/**
 * Minimal step: user describes their issue → we create ticket + trigger AI → onReady(ticket).
 * Parent then opens AIChatPanel with that ticket. No conversation UI here.
 */
const determineCategory = (issue) => {
  const lower = (issue || '').toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('network')) return 'network';
  if (lower.includes('computer') || lower.includes('laptop') || lower.includes('printer')) return 'hardware';
  if (lower.includes('software') || lower.includes('app') || lower.includes('program')) return 'software';
  if (lower.includes('email') || lower.includes('outlook')) return 'email';
  return 'other';
};

const DescribeIssueModal = ({ onReady, onClose }) => {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = TokenService.getUser();
      const newTicket = await api.tickets.create({
        user: user?.id ?? user?.user_id,
        issue_type: description.substring(0, 100),
        description: description.trim(),
        category: determineCategory(description),
        status: 'new',
      });
      const ticketId = newTicket.id || newTicket.ticket_id;
      await api.agent.processTicket(ticketId, { force: true });
      onReady?.(newTicket);
      onClose?.();
    } catch (err) {
      console.error('DescribeIssueModal:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-950 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Describe your issue</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">We’ll open the AI assistant right after so you can get help in one place.</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What do you need help with?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My printer won’t connect to Wi-Fi, Outlook keeps asking for password..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
              autoFocus
              disabled={submitting}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!description.trim() || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Creating and starting AI…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI help
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default DescribeIssueModal;
