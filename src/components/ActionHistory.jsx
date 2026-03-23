import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, RotateCcw, Clock, XCircle } from 'lucide-react';
import { api } from '../services/api';
import Button from './ui/Button';

/**
 * ActionHistory Component
 * Displays autonomous actions taken on a ticket with rollback capability
 */
const ActionHistory = ({ ticketId }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackReason, setRollbackReason] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackError, setRollbackError] = useState('');
  const [rollbackNotice, setRollbackNotice] = useState('');

  useEffect(() => {
    if (ticketId) {
      fetchActionHistory();
    }
  }, [ticketId]);

  const fetchActionHistory = async () => {
    try {
      setLoading(true);
      const data = await api.tickets.actionHistory(ticketId);
      setActions(data?.action_history ?? data ?? []);
    } catch (error) {
      console.error('Failed to fetch action history:', error);
      setActions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    setRollbackError('');
    if (!selectedAction || !rollbackReason.trim()) {
      setRollbackError('Please provide a reason for rollback.');
      return;
    }

    setRollbackLoading(true);
    try {
      await api.tickets.rollbackAction(selectedAction.id, { reason: rollbackReason });

      fetchActionHistory();
      setShowRollbackModal(false);
      setRollbackReason('');
      setSelectedAction(null);
      setRollbackNotice('Action rolled back successfully.');
      setTimeout(() => setRollbackNotice(''), 5000);
    } catch (error) {
      console.error('Rollback failed:', error);
      setRollbackError(error?.message || 'Rollback failed. Please try again.');
    } finally {
      setRollbackLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'AUTO_RESOLVE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ESCALATE':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'ASSIGN_TO_TEAM':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActionLabel = (actionType) => {
    return actionType.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No autonomous actions taken yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Autonomous Action History
      </h3>

      <div className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`border rounded-lg p-4 ${
              action.rolled_back
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getActionIcon(action.action_type)}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {getActionLabel(action.action_type)}
                    {action.rolled_back && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full dark:bg-red-800 dark:text-red-100">
                        ROLLED BACK
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Executed: {new Date(action.executed_at).toLocaleString()}
                  </p>
                  {action.confidence_score && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Confidence: {(action.confidence_score * 100).toFixed(1)}%
                    </p>
                  )}
                  {action.rolled_back && action.rollback_reason && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      <strong>Rollback reason:</strong> {action.rollback_reason}
                    </p>
                  )}
                </div>
              </div>

              {action.rollback_possible && !action.rolled_back && (
                <button
                  onClick={() => {
                    setSelectedAction(action);
                    setRollbackError('');
                    setShowRollbackModal(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                  title="Rollback this action"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rollback</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {rollbackNotice && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200" role="status">
          {rollbackNotice}
        </div>
      )}

      {/* Rollback Modal */}
      {showRollbackModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="rollback-modal-title">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              aria-label="Close"
              onClick={() => {
                if (rollbackLoading) return;
                setShowRollbackModal(false);
                setRollbackReason('');
                setRollbackError('');
                setSelectedAction(null);
              }}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-md w-full">
              <h3 id="rollback-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Confirm rollback
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Roll back <strong>{getActionLabel(selectedAction?.action_type)}</strong>? This will revert the ticket to its previous state.
              </p>

              {rollbackError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200" role="alert">
                  {rollbackError}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rollback
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => {
                  setRollbackReason(e.target.value);
                  if (rollbackError) setRollbackError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={3}
                placeholder="Explain why this action needs to be reversed…"
              />

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRollbackModal(false);
                    setRollbackReason('');
                    setRollbackError('');
                    setSelectedAction(null);
                  }}
                  disabled={rollbackLoading}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={!rollbackReason.trim() || rollbackLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rollbackLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Rolling back…
                    </span>
                  ) : (
                    'Confirm rollback'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionHistory;
