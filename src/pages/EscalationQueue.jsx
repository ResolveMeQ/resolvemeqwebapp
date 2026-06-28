import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, UserCheck, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api, TokenService } from '../services/api';

const PRIORITY_BADGE = {
  critical: 'error',
  high: 'warning',
  medium: 'primary',
  low: 'secondary',
};

/** Relative time since an ISO timestamp, e.g. "2h ago". */
function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** SLA countdown/overdue text from an ISO due date. */
function slaText(iso) {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) {
    const overdueHours = Math.round(-diffMs / 3600000);
    return { text: overdueHours < 1 ? 'Overdue' : `Overdue by ${overdueHours}h`, overdue: true };
  }
  const hours = diffMs / 3600000;
  return { text: hours < 1 ? 'Due soon' : `Due in ${Math.round(hours)}h`, overdue: false };
}

const EscalationQueue = () => {
  const navigate = useNavigate();
  const currentUser = TokenService.getUser();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastSeq = useRef(0);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastSeq.current;
    setToast({ id, message, type });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.tickets.getEscalationQueue();
      setTickets(data?.tickets || []);
    } catch (e) {
      setError(e?.message || 'Could not load the escalation queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async (ticket) => {
    if (!currentUser?.id) return;
    setClaimingId(ticket.ticket_id);
    try {
      const res = await api.tickets.assign(ticket.ticket_id, currentUser.id);
      const updated = res?.ticket;
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticket.ticket_id ? { ...t, ...(updated || {}) } : t))
      );
      showToast(res?.message || 'Ticket claimed.', updated?.claimed_at ? 'success' : 'info');
    } catch (e) {
      showToast(e?.message || 'Could not claim this ticket.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Escalation Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Escalated tickets across your team, sorted by priority then how long they've waited.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={load} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
          {error}
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Nothing escalated right now — the queue is empty.
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {tickets.map((ticket) => {
              const sla = slaText(ticket.sla_due_at);
              const claimed = Boolean(ticket.claimed_at);
              return (
                <motion.div
                  key={ticket.ticket_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="p-4 flex flex-wrap items-center gap-3" hover>
                    <Badge variant={PRIORITY_BADGE[ticket.escalation_priority] || 'secondary'}>
                      {(ticket.escalation_priority || 'medium').toUpperCase()}
                    </Badge>

                    <div
                      className="flex-1 min-w-[160px] cursor-pointer"
                      onClick={() => navigate(`/tickets?highlight=${ticket.ticket_id}`)}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        #{ticket.ticket_id} · {ticket.issue_type || ticket.category}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Escalated {timeAgo(ticket.escalated_at)}
                        {sla && (
                          <span className={sla.overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {' '}· {sla.text}
                          </span>
                        )}
                      </p>
                    </div>

                    {claimed ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        Claimed by {ticket.assigned_to_name || 'a teammate'}
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={claimingId === ticket.ticket_id}
                        onClick={() => handleClaim(ticket)}
                      >
                        Claim
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
            toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default EscalationQueue;
