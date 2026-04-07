import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, FolderOpen, CheckCircle, Clock, ListTodo, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AIRecommendationsPanel from '../components/AIRecommendationsPanel';
import AIChatPanel from '../components/AIChatPanel';
import { api } from '../services/api';
import { DashboardPageSkeleton } from '../components/ui/Skeleton';

/**
 * Dashboard page component - Real-time analytics and ticket overview
 */
const Dashboard = ({ activeTeamId }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatTicket, setChatTicket] = useState(null);
  const [showAIChatPanel, setShowAIChatPanel] = useState(false);
  const [escalatedTickets, setEscalatedTickets] = useState([]);
  const [escalatedLoading, setEscalatedLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when workspace (active team) changes
  }, [activeTeamId]);

  const loadEscalationQueue = async () => {
    setEscalatedLoading(true);
    try {
      const data = await api.tickets.getEscalationQueue({ limit: 10 });
      setEscalatedTickets(data?.tickets ?? []);
    } catch {
      setEscalatedTickets([]);
    } finally {
      setEscalatedLoading(false);
    }
  };

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [analyticsData, ticketsData, escData] = await Promise.all([
        api.analytics.getTicketAnalytics(),
        api.tickets.list({ limit: 5 }),
        api.tickets.getEscalationQueue({ limit: 10 }).catch(() => ({ tickets: [] })),
      ]);
      
      setAnalytics(analyticsData);
      setRecentTickets(Array.isArray(ticketsData) ? ticketsData.slice(0, 5) : []);
      setEscalatedTickets(Array.isArray(escData?.tickets) ? escData.tickets : []);
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

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open' || s === 'new') return <Badge variant="warning">Open</Badge>;
    if (s === 'in-progress' || s === 'in_progress') return <Badge variant="info">In Progress</Badge>;
    if (s === 'resolved') return <Badge variant="success">Resolved</Badge>;
    if (s === 'escalated') return <Badge variant="error">Escalated</Badge>;
    if (s === 'pending_clarification') return <Badge variant="warning">Pending clarification</Badge>;
    if (s === 'pending') return <Badge variant="warning">Pending</Badge>;
    // Format unknown statuses: snake_case → Title Case
    const friendly = (status || '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return <Badge variant="default">{friendly}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <Badge variant="error" className="bg-red-100 text-red-700">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="success" className="bg-green-100 text-green-700">Low</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary action: resolve your issue — what brought users to the platform */}
      <Card className="p-6 md:p-8 border-2 border-primary-200 dark:border-primary-900/50 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-950/30 dark:to-gray-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Resolve your issue
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
              Create a ticket with Subject, Description, and Category — then our AI assistant will help you resolve it right away.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
              className="mt-4"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              New Ticket — Get AI help
            </Button>
          </div>
          <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/40 items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </Card>

      <header>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your tickets and personal metrics</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics ? (analytics.open_tickets + analytics.closed_tickets) : 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics?.open_tickets ?? 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics?.closed_tickets ?? 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Resolution</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {formatTime(analytics?.avg_resolution_time_seconds)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      <AIRecommendationsPanel />

      <Card className="p-6 border-l-4 border-l-amber-500 dark:border-l-amber-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Your escalated tickets
            {escalatedTickets.length > 0 && (
              <Badge variant="error" className="ml-1">{escalatedTickets.length}</Badge>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={loadEscalationQueue} disabled={escalatedLoading}>
            Refresh
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Tickets you created or that are assigned to you, marked escalated.
        </p>
        {escalatedLoading && escalatedTickets.length === 0 ? (
          <div className="space-y-3 py-2">
            {[0, 1].map((k) => (
              <div
                key={k}
                className="h-[3.25rem] w-full rounded-lg animate-pulse bg-gray-200/90 dark:bg-gray-700/70"
              />
            ))}
          </div>
        ) : escalatedTickets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">None escalated right now.</p>
        ) : (
          <div className="space-y-3">
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

      {/* Recent tickets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Tickets</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            View all
          </Button>
        </div>
        {recentTickets.length === 0 ? (
          <div className="py-12 text-center">
            <ListTodo className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No recent tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <button
                key={ticket.ticket_id}
                type="button"
                onClick={() => navigate('/tickets', { state: { openTicketId: ticket.ticket_id ?? ticket.id } })}
                className="w-full flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150 cursor-pointer text-left group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {ticket.description || ticket.issue_type || 'No title'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {ticket.category || 'Uncategorized'} · {formatTicketTime(ticket.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(ticket.status)}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* AI Assistant panel: when user opens chat from a recent ticket. New tickets go to /tickets. */}
      {showAIChatPanel && chatTicket && (
        <AIChatPanel
          ticket={chatTicket}
          isOpen={true}
          onClose={() => {
            setShowAIChatPanel(false);
            setChatTicket(null);
            loadDashboardData(true);
          }}
          onTicketUpdate={(updated) => {
            if (!updated) return;
            setChatTicket((prev) => (prev ? { ...prev, ...updated } : null));
          }}
          onActionComplete={() => loadDashboardData(true)}
          onFocusComments={() => {
            const id = chatTicket?.ticket_id ?? chatTicket?.id;
            setShowAIChatPanel(false);
            setChatTicket(null);
            if (id != null) {
              navigate('/tickets', { state: { openTicketId: id, focusComments: true } });
            }
          }}
        />
      )}

      {/* Floating action: go to Tickets to create new ticket */}
      <button
        type="button"
        onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
        className="fixed z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 touch-manipulation"
        style={{ bottom: 'max(2rem, env(safe-area-inset-bottom))', right: 'max(2rem, env(safe-area-inset-right))' }}
        aria-label="Resolve an issue"
        title="Resolve an issue"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard; 