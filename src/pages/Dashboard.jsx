import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Ticket,
  FolderOpen,
  CheckCircle,
  Clock,
  ListTodo,
  Plus,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import AIRecommendationsPanel from '../components/AIRecommendationsPanel';
import WorkspaceRequiredBanner from '../components/WorkspaceRequiredBanner';
import { api, TokenService, userCanAccessEscalationQueue, getApiErrorMessage } from '../services/api';
import { DashboardPageSkeleton } from '../components/ui/Skeleton';

/**
 * Dashboard page component - Real-time analytics and ticket overview
 */
const Dashboard = ({ activeTeamId }) => {
  const navigate = useNavigate();
  const showEscalationQueue = userCanAccessEscalationQueue(TokenService.getUser());
  const [analytics, setAnalytics] = useState(null);
  const [outcomeMetrics, setOutcomeMetrics] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [escalatedTickets, setEscalatedTickets] = useState([]);
  const [escalatedLoading, setEscalatedLoading] = useState(false);
  const [escalatedError, setEscalatedError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when workspace (active team) changes
  }, [activeTeamId]);

  // Live-ish refresh so a newly escalated ticket or a claim shows up without a manual reload.
  useEffect(() => {
    const interval = setInterval(() => loadDashboardData(true), 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadDashboardData closes over activeTeamId-derived state via showEscalationQueue, stable per mount
  }, [activeTeamId]);

  const loadEscalationQueue = async () => {
    if (!showEscalationQueue) return;
    setEscalatedLoading(true);
    setEscalatedError(null);
    try {
      const data = await api.tickets.getEscalationQueue({ limit: 10 });
      setEscalatedTickets(data?.tickets ?? []);
    } catch (err) {
      setEscalatedTickets([]);
      setEscalatedError(getApiErrorMessage(err, 'Could not load the escalation queue.'));
    } finally {
      setEscalatedLoading(false);
    }
  };

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [analyticsData, ticketsData, escData, outcomeData] = await Promise.all([
        api.analytics.getTicketAnalytics(),
        api.tickets.list({ limit: 5 }),
        showEscalationQueue
          ? api.tickets.getEscalationQueue({ limit: 10 }).catch((err) => {
              if (!silent) {
                setEscalatedError(getApiErrorMessage(err, 'Could not load the escalation queue.'));
              }
              return { tickets: [] };
            })
          : Promise.resolve({ tickets: [] }),
        api.analytics.getOutcomeMetrics().catch(() => null),
      ]);
      
      setAnalytics(analyticsData);
      setOutcomeMetrics(outcomeData);
      setRecentTickets(Array.isArray(ticketsData) ? ticketsData.slice(0, 5) : []);
      setEscalatedTickets(Array.isArray(escData?.tickets) ? escData.tickets : []);
      if (!silent && escData?.tickets?.length) setEscalatedError(null);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (!silent) {
        setError(err.message);
        setAnalytics({
          open_tickets: 0,
          closed_tickets: 0,
          avg_resolution_time_seconds: null,
          tickets_per_week: []
        });
        setRecentTickets([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTicketTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const ticketVolumeSeries = useMemo(() => {
    const analyticsSeries = Array.isArray(analytics?.tickets_per_week)
      ? analytics.tickets_per_week
      .map((entry, idx) => {
        if (typeof entry === 'number') {
          return { label: `W${idx + 1}`, value: Math.max(0, entry) };
        }
        if (entry && typeof entry === 'object') {
          const value = Number(
            entry.count ?? entry.total ?? entry.tickets ?? entry.value ?? 0
          );
          const rawLabel = entry.label ?? entry.week ?? `W${idx + 1}`;
          const parsed = new Date(rawLabel);
          const label = Number.isNaN(parsed.getTime())
            ? String(rawLabel)
            : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            label,
            value: Number.isFinite(value) ? Math.max(0, value) : 0,
          };
        }
        return { label: `W${idx + 1}`, value: 0 };
      })
      .slice(-8)
      : [];

    if (analyticsSeries.some((item) => item.value > 0)) {
      return analyticsSeries;
    }

    // Fallback: derive trend from visible escalated queue when analytics is empty/flat.
    if (!Array.isArray(escalatedTickets) || escalatedTickets.length === 0) {
      return analyticsSeries;
    }

    const buckets = new Map();
    escalatedTickets.forEach((ticket) => {
      const ts = ticket?.updated_at || ticket?.created_at;
      if (!ts) return;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([isoDate, value]) => {
        const d = new Date(isoDate);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value,
        };
      });
  }, [analytics?.tickets_per_week, escalatedTickets]);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  const totalTickets = (analytics?.open_tickets ?? 0) + (analytics?.closed_tickets ?? 0);
  const resolvedRate = totalTickets > 0
    ? Math.round(((analytics?.closed_tickets ?? 0) / totalTickets) * 100)
    : 0;

  const deflectionRate =
    outcomeMetrics?.deflection_rate_percent != null
      ? Math.round(outcomeMetrics.deflection_rate_percent)
      : null;

  const highestTicketVolume = Math.max(...ticketVolumeSeries.map((item) => item.value), 1);
  const hasTicketVolume = ticketVolumeSeries.some((item) => item.value > 0);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open' || s === 'new') return <Badge variant="warning">Open</Badge>;
    if (s === 'in-progress' || s === 'in_progress') return <Badge variant="info">In Progress</Badge>;
    if (s === 'resolved') return <Badge variant="success">Resolved</Badge>;
    if (s === 'escalated') return <Badge variant="error">Escalated</Badge>;
    if (s === 'pending_clarification') return <Badge variant="warning">Needs info</Badge>;
    if (s === 'pending') return <Badge variant="warning">Pending</Badge>;
    // Format unknown statuses: snake_case → Title Case
    const friendly = (status || '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return <Badge variant="default">{friendly}</Badge>;
  };

  /**
   * Tickets have no top-level `priority` column; AI analysis may store severity in agent_response.
   */
  const resolveTicketPriority = (ticket) => {
    if (!ticket) return '';
    const top = ticket.priority;
    if (top != null && String(top).trim()) {
      return String(top).trim().toLowerCase();
    }
    const ar = ticket.agent_response;
    if (ar && typeof ar === 'object') {
      const analysis = ar.analysis && typeof ar.analysis === 'object' ? ar.analysis : null;
      const cand = ar.severity ?? ar.priority ?? (analysis && (analysis.severity ?? analysis.priority));
      if (cand != null && String(cand).trim()) {
        return String(cand).trim().toLowerCase();
      }
    }
    return '';
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase().trim();
    if (!p) {
      return <Badge variant="default">Standard</Badge>;
    }
    switch (p) {
      case 'critical':
        return <Badge variant="error" className="bg-red-100 text-red-700">Critical</Badge>;
      case 'high':
        return <Badge variant="error" className="bg-red-100 text-red-700">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="success" className="bg-green-100 text-green-700">Low</Badge>;
      default: {
        const friendly = p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return <Badge variant="default">{friendly}</Badge>;
      }
    }
  };

  return (
    <div className="space-y-6">
      {!activeTeamId && (
        <WorkspaceRequiredBanner title="Set up your workspace to get started" />
      )}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-6 items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Ticket queue
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-3 max-w-2xl">
              Create a ticket, follow the recommended next steps, and track resolution
              across your team from one place.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
                className="shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Ticket
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/tickets')}
              >
                View Ticket Queue
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">This week</p>
              <Badge variant="success" className="gap-1">
                <Activity className="w-3.5 h-3.5" />
                Live
              </Badge>
            </div>
            <div className="mt-4 flex items-stretch gap-2 h-24">
              {ticketVolumeSeries.length > 0 && hasTicketVolume ? (
                ticketVolumeSeries.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0">
                    <div
                      className="w-full rounded-md bg-primary-600 dark:bg-primary-500"
                      style={{ height: `${Math.max(12, (item.value / highestTicketVolume) * 100)}%` }}
                      title={`${item.label}: ${item.value}`}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  No ticket activity this week yet
                </div>
              )}
            </div>
            {showEscalationQueue && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Escalated tickets</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white tabular-nums">
                  {escalatedTickets.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadEscalationQueue}
                disabled={escalatedLoading}
              >
                Refresh queue
              </Button>
            </div>
            )}
          </div>
        </div>
      </section>

      {error && (
        <Card className="p-4 border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">Some dashboard data could not be loaded. Showing available data.</p>
          </div>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard label="Total Tickets" value={totalTickets} icon={Ticket} tone="blue" />
        <StatCard label="Open" value={analytics?.open_tickets ?? 0} icon={FolderOpen} tone="amber" />
        <StatCard label="Resolved" value={analytics?.closed_tickets ?? 0} icon={CheckCircle} tone="green" />
        <StatCard label="Avg. Resolution" value={formatTime(analytics?.avg_resolution_time_seconds)} icon={Clock} tone="gray" />
        <StatCard label="Resolution Rate" value={`${resolvedRate}%`} icon={TrendingUp} tone="primary" />
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="AI Deflection"
          value={deflectionRate != null ? `${deflectionRate}%` : '—'}
          tone="primary"
        />
        <StatCard
          label="Onboarding Done"
          value={
            outcomeMetrics?.onboarding_playbook?.completion_rate_percent != null
              ? `${Math.round(outcomeMetrics.onboarding_playbook.completion_rate_percent)}%`
              : outcomeMetrics?.onboarding_playbook?.workflows_completed ?? '—'
          }
          tone="green"
        />
        <StatCard label="AI Processed" value={outcomeMetrics?.agent_processed_count ?? '—'} tone="gray" />
        <StatCard label="Escalated" value={outcomeMetrics?.escalated_count ?? '—'} tone="amber" />
        <StatCard label="Workflows Done" value={outcomeMetrics?.workflows_completed_count ?? '—'} tone="gray" />
      </div>

      {(outcomeMetrics?.stuck_items?.stuck_ticket_count > 0 || outcomeMetrics?.stuck_items?.stalled_step_count > 0) && (
        <Card className="p-5 rounded-xl border-l-4 border-l-amber-500 dark:border-l-amber-600">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">What's stuck</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Idle 24h+ or past a workflow step's due date</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {outcomeMetrics.stuck_items.stuck_tickets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Idle tickets ({outcomeMetrics.stuck_items.stuck_ticket_count})
                </p>
                <div className="space-y-1.5">
                  {outcomeMetrics.stuck_items.stuck_tickets.map((t) => (
                    <button
                      key={t.ticket_id}
                      type="button"
                      onClick={() => navigate('/tickets', { state: { openTicketId: t.ticket_id } })}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-left group"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        #{t.ticket_id} {t.issue_type || ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">{t.hours_idle}h idle</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {outcomeMetrics.stuck_items.stalled_steps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Overdue workflow steps ({outcomeMetrics.stuck_items.stalled_step_count})
                </p>
                <div className="space-y-1.5">
                  {outcomeMetrics.stuck_items.stalled_steps.map((s, idx) => (
                    <button
                      key={`${s.workflow_id}-${idx}`}
                      type="button"
                      onClick={() => s.ticket_id && navigate('/tickets', { state: { openTicketId: s.ticket_id } })}
                      disabled={!s.ticket_id}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-left group disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {s.step_title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">{s.hours_overdue}h overdue</span>
                      {s.ticket_id && <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Operational Snapshot</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              Keep resolution quality high as volume scales
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Resolution stays strongest when priority tickets are handled quickly and escalations stay low.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={resolvedRate >= 60 ? 'success' : 'warning'} className="gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {resolvedRate >= 60 ? 'Healthy throughput' : 'Needs attention'}
            </Badge>
          </div>
        </div>
      </Card>

      <AIRecommendationsPanel />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className={`p-6 rounded-xl ${showEscalationQueue ? 'xl:col-span-3' : 'xl:col-span-5'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Tickets</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
              View all
            </Button>
          </div>
          {recentTickets.length === 0 ? (
            <EmptyState icon={ListTodo} title="No recent tickets" description="New tickets will show up here as they come in." />
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  type="button"
                  onClick={() => navigate('/tickets', { state: { openTicketId: ticket.ticket_id ?? ticket.id } })}
                  className="w-full flex items-center justify-between gap-4 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150 cursor-pointer text-left group border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {ticket.description || ticket.issue_type || 'No title'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {ticket.category || 'Uncategorized'} · {formatTicketTime(ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getPriorityBadge(resolveTicketPriority(ticket))}
                    {getStatusBadge(ticket.status)}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {showEscalationQueue && (
        <Card className="p-6 xl:col-span-2 rounded-xl border-l-4 border-l-amber-500 dark:border-l-amber-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Escalation Queue
              {escalatedTickets.length > 0 && (
                <Badge variant="error" className="ml-1">{escalatedTickets.length}</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={loadEscalationQueue} disabled={escalatedLoading}>
              Refresh
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Escalated tickets across your teams, sorted by priority.
          </p>
          {escalatedError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
              {escalatedError}
            </p>
          )}
          {escalatedLoading && escalatedTickets.length === 0 ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  className="h-[3.25rem] w-full rounded-lg animate-pulse bg-gray-200/90 dark:bg-gray-700/70"
                />
              ))}
            </div>
          ) : escalatedTickets.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No escalated tickets right now.</p>
          ) : (
            <div className="space-y-2">
              {escalatedTickets.map((t) => (
                <button
                  key={t.ticket_id ?? t.id}
                  type="button"
                  onClick={() => navigate('/tickets', { state: { openTicketId: t.ticket_id ?? t.id } })}
                  className="w-full flex items-center justify-between gap-4 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      #{t.ticket_id ?? t.id}: {t.issue_type || t.description || 'No title'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.category || '—'} · {formatTicketTime(t.created_at)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </Card>
        )}
      </div>

      {/* Floating action: go to Tickets to create new ticket */}
      <button
        type="button"
        onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
        className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 touch-manipulation"
        style={{ bottom: 'max(2rem, env(safe-area-inset-bottom))', right: 'max(2rem, env(safe-area-inset-right))' }}
        aria-label="Resolve an issue"
        title="Resolve an issue"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard; 