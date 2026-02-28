import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ResolutionAnalytics from '../components/ResolutionAnalytics';
import { api } from '../services/api';

/**
 * Analytics page with clean data visualization
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Performance insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => loadAnalytics(true)} loading={refreshLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" disabled title="Coming soon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadAnalytics()}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="default" className="text-xs">Total</Badge>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {totalTickets.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Total Tickets
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <Activity className="w-3.5 h-3.5 mr-1" />
                  {analytics.open_tickets} open · {analytics.closed_tickets} closed
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="success" className="text-xs">Rate</Badge>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {resolutionRate}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Resolution Rate
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {analytics.closed_tickets} resolved
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="default" className="text-xs">Avg</Badge>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {formatResolutionTime(analytics.avg_resolution_time_seconds)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Resolution Time
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Average duration
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <Badge variant="default" className="text-xs">Score</Badge>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                  {satisfactionScore != null ? `${satisfactionScore}/5` : 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Satisfaction
                </div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <Star className="w-3.5 h-3.5 mr-1" />
                  {satisfactionScore != null ? 'From feedback' : 'No data yet'}
                </div>
              </div>
            </Card>
          </div>

          <ResolutionAnalytics />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Tracking</h3>
                  <Badge variant="default" className="text-xs">Coming soon</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Real-time metrics and KPIs for resolution times and agent performance
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Category Analysis</h3>
                  <Badge variant="default" className="text-xs">Coming soon</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Breakdown of tickets by category, priority, and resolution patterns
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
                  <Badge variant="default" className="text-xs">Coming soon</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Historical trends to identify patterns and optimize support
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
