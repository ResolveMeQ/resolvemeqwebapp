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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Operational overview and ticket metrics</p>
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
              <div key={ticket.ticket_id} className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {ticket.issue_type || 'No title'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {ticket.category || 'Uncategorized'} · {formatTicketTime(ticket.created_at)}
                  </p>
                </div>
                {getStatusBadge(ticket.status)}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => navigate('/tickets', { state: { openCreateForm: true } })}
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Create ticket"
        title="Create ticket"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard; 