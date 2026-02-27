import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, FolderOpen, CheckCircle, Clock, ListTodo, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AIRecommendationsPanel from '../components/AIRecommendationsPanel';
import { api } from '../services/api';

/**
 * Dashboard page component - Real-time analytics and ticket overview
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, ticketsData] = await Promise.all([
        api.analytics.getTicketAnalytics(),
        api.tickets.list({ limit: 5 })
      ]);
      
      setAnalytics(analyticsData);
      setRecentTickets(Array.isArray(ticketsData) ? ticketsData.slice(0, 5) : []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
      setAnalytics({
        open_tickets: 0,
        closed_tickets: 0,
        avg_resolution_time_seconds: null,
        tickets_per_week: []
      });
      setRecentTickets([]);
    } finally {
      setLoading(false);
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
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
      case 'new':
        return <Badge variant="warning">Open</Badge>;
      case 'in-progress':
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
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
    <div className="space-y-8 p-6 relative pb-20">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ticket overview and activity</p>
      </header>

      {/* Overview stats */}
      <Card className="p-6">
        <h2 className="text-base font-medium text-gray-900 dark:text-white mb-5">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                {analytics ? (analytics.open_tickets + analytics.closed_tickets) : 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total tickets</div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                {analytics?.open_tickets ?? 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Open</div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                {analytics?.closed_tickets ?? 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resolved</div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                {formatTime(analytics?.avg_resolution_time_seconds)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg. resolution</div>
            </div>
          </div>
        </div>
      </Card>

      <AIRecommendationsPanel />

      {/* Recent tickets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            Recent tickets
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/tickets')}>
            View all
          </Button>
        </div>
        {recentTickets.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            No recent tickets
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentTickets.map((ticket) => (
              <li key={ticket.ticket_id} className="py-4 first:pt-0 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {ticket.issue_type || 'No title'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {ticket.category || 'Uncategorized'} · {formatTicketTime(ticket.created_at)}
                  </div>
                </div>
                {getStatusBadge(ticket.status)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Floating action button: create ticket */}
      <button
        type="button"
        onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Create ticket"
        title="Create ticket"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default Dashboard; 