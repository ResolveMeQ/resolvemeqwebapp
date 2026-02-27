import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  Download,
  Filter,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ResolutionAnalytics from '../components/ResolutionAnalytics';
import { api } from '../services/api';

/**
 * Analytics page – uses real data from ticket analytics and resolution feedback APIs.
 * No hardcoded metrics; non-working actions are marked as coming soon.
 */
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    open_tickets: 0,
    closed_tickets: 0,
    avg_resolution_time_seconds: 0,
    tickets_per_week: []
  });
  const [resolutionAnalytics, setResolutionAnalytics] = useState(null);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const [ticketData, resolutionData] = await Promise.all([
        api.analytics.getTicketAnalytics(),
        api.analytics.getResolutionAnalytics().catch(() => null)
      ]);
      const raw = ticketData || {};
      setAnalytics({
        open_tickets: Number(raw.open_tickets ?? raw.open ?? 0),
        closed_tickets: Number(raw.closed_tickets ?? raw.closed ?? 0),
        avg_resolution_time_seconds: Number(raw.avg_resolution_time_seconds ?? raw.avg_resolution_time ?? 0),
        tickets_per_week: Array.isArray(raw.tickets_per_week) ? raw.tickets_per_week : []
      });
      setResolutionAnalytics(resolutionData || null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatResolutionTime = (seconds) => {
    if (seconds == null || seconds === 0) return 'N/A';
    const hours = Math.floor(Number(seconds) / 3600);
    if (hours >= 24) return `${(hours / 24).toFixed(1)} days`;
    return `${hours.toFixed(1)} h`;
  };

  const totalTickets = (analytics.open_tickets || 0) + (analytics.closed_tickets || 0);
  const resolutionRate = totalTickets > 0
    ? ((analytics.closed_tickets / totalTickets) * 100).toFixed(1)
    : '0';
  const satisfactionScore = resolutionAnalytics?.average_satisfaction_score != null
    ? Number(resolutionAnalytics.average_satisfaction_score).toFixed(1)
    : null;

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total tickets', totalTickets],
      ['Open tickets', analytics.open_tickets],
      ['Closed tickets', analytics.closed_tickets],
      ['Resolution rate (%)', resolutionRate],
      ['Avg resolution time', formatResolutionTime(analytics.avg_resolution_time_seconds)],
      ['Avg satisfaction (from feedback)', satisfactionScore ?? 'N/A']
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">ResolveMeQ Performance Insights</p>
        <p className="text-gray-500 dark:text-gray-400">Metrics from your tickets and resolution feedback</p>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
      >
        <div className="flex items-center flex-wrap gap-2">
          <Button variant="primary" size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500" onClick={() => loadAnalytics(true)} loading={refreshLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming soon">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" disabled title="Coming soon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        {!error && !loading && (
          <Badge variant="success" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            From your data
          </Badge>
        )}
      </motion.div>

      {error && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadAnalytics()}>Retry</Button>
        </div>
      )}

      {/* Key Metrics Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/50 dark:border-blue-800/50">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{totalTickets.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Total Tickets</div>
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  <Activity className="w-4 h-4 mr-1" />
                  {analytics.open_tickets} open, {analytics.closed_tickets} closed
                </div>
              </div>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-800/50">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{resolutionRate}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Resolution Rate</div>
                <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {analytics.closed_tickets} resolved
                </div>
              </div>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/50 dark:border-purple-800/50">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{formatResolutionTime(analytics.avg_resolution_time_seconds)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Avg Resolution Time</div>
                <div className="flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-1" />
                  Time to resolve
                </div>
              </div>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-800/50">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {satisfactionScore != null ? `${satisfactionScore}/5` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Customer Satisfaction</div>
                <div className="flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                  <Star className="w-4 h-4 mr-1" />
                  {satisfactionScore != null ? 'From resolution feedback' : 'No feedback yet'}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Resolution feedback analytics (backend: GET /api/tickets/resolution-analytics/) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <ResolutionAnalytics />
          </motion.div>
        </>
      )}

      {/* Upcoming analytics sections – clearly marked as coming soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Performance Tracking</h3>
              <Badge variant="default" className="text-xs">Coming soon</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Real-time metrics and KPIs for resolution times and agent performance.
            </p>
          </div>
        </Card>
        <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Category Analysis</h3>
              <Badge variant="default" className="text-xs">Coming soon</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Breakdown of tickets by category, priority, and resolution patterns.
            </p>
          </div>
        </Card>
        <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Trend Analysis</h3>
              <Badge variant="default" className="text-xs">Coming soon</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Historical trends to identify patterns and optimize support.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center text-gray-500 dark:text-gray-400 text-sm p-6"
      >
        <p className="text-gray-500 dark:text-gray-400">Data-driven insights for better IT support operations</p>
        <p className="mt-1 text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} ResolveMeQ. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default Analytics; 