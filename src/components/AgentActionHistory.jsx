import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import ConfidenceBadge from './ui/ConfidenceBadge';
import { cn } from '../utils/cn';

/**
 * AgentActionHistory - Display ticket action history with rollback capability
 * Implements enterprise-grade audit trail and undo functionality
 */
const AgentActionHistory = ({ ticketId, actions, onRollback }) => {
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [loading, setLoading] = useState(false);

  const actionTypeConfig = {
    AUTO_RESOLVE: {
      label: 'Auto Resolved',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    ESCALATE: {
      label: 'Escalated',
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    REQUEST_CLARIFICATION: {
      label: 'Clarification Requested',
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
    ASSIGN_TO_TEAM: {
      label: 'Assigned to Team',
      icon: User,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    SCHEDULE_FOLLOWUP: {
      label: 'Follow-up Scheduled',
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    CREATE_KB_ARTICLE: {
      label: 'KB Article Created',
      icon: CheckCircle,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
  };

  const handleRollbackClick = (action) => {
    setSelectedAction(action);
    setRollbackReason('');
    setRollbackDialogOpen(true);
  };

  const handleRollbackSubmit = async () => {
    if (!rollbackReason.trim() || !selectedAction) return;

    setLoading(true);
    try {
      await onRollback(selectedAction.id, rollbackReason);
      setRollbackDialogOpen(false);
      setSelectedAction(null);
      setRollbackReason('');
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!actions || actions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <History className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No action history available
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const config = actionTypeConfig[action.action_type] || {
            label: action.action_type,
            icon: Clock,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
          };
          const Icon = config.icon;

          return (
            <Card
              key={action.id}
              className={cn(
                'p-4 transition-all duration-150',
                action.rolled_back && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {config.label}
                      </h4>
                      {action.rolled_back && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded border border-gray-300 dark:border-gray-700">
                          Rolled Back
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(action.executed_at)}
                      </span>
                      {action.executed_by && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {action.executed_by}
                          </span>
                        </>
                      )}
                    </div>

                    {action.confidence_score && (
                      <div className="mb-2">
                        <ConfidenceBadge
                          confidence={action.confidence_score}
                          size="sm"
                        />
                      </div>
                    )}

                    {action.rolled_back && action.rollback_reason && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Rollback reason:</span>{' '}
                          {action.rollback_reason}
                        </p>
                        {action.rolled_back_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Rolled back on {formatDate(action.rolled_back_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {action.rollback_possible && !action.rolled_back && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollbackClick(action)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Undo
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Rollback Dialog */}
      <AnimatePresence>
        {rollbackDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !loading && setRollbackDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rollback Action
                </h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This will undo the action and restore the ticket to its previous state.
                Please provide a reason for this rollback.
              </p>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Reason for Rollback
                </label>
                <textarea
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="e.g., User reported issue persists, Incorrect solution applied..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRollbackDialogOpen(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRollbackSubmit}
                  disabled={!rollbackReason.trim() || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Confirm Rollback
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgentActionHistory;
