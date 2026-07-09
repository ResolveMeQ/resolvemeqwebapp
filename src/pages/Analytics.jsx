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
import ResolutionAnalytics from '../components/ResolutionAnalytics';
import { api } from '../services/api';
import { AnalyticsPageSkeleton } from '../components/ui/Skeleton';

/**
 * Analytics page with clean data visualization
 */
const Analytics = ({ activeTeamId }) => {
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
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const [ticketData, resolutionData, advancedData] = await Promise.all([
        api.analytics.getTicketAnalytics(),
        api.analytics.getResolutionAnalytics().catch(() => null),
        api.analytics.getAdvancedAnalytics().catch(() => null),
      ]);
      const raw = ticketData || {};
      setAnalytics({
        open_tickets: Number(raw.open_tickets ?? raw.open ?? 0),
        closed_tickets: Number(raw.closed_tickets ?? raw.closed ?? 0),
        avg_resolution_time_seconds: Number(raw.avg_resolution_time_seconds ?? raw.avg_resolution_time ?? 0),
        tickets_per_week: Array.isArray(raw.tickets_per_week) ? raw.tickets_per_week : []
      });
      setResolutionAnalytics(resolutionData || null);
      setAdvancedAnalytics(advancedData || null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when workspace (active team) changes
  }, [activeTeamId]);

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
      ['Avg satisfaction (from feedback)', satisfactionScore ?? 'N/A'],
    ];
    if (advancedAnalytics?.deflection_by_category?.length) {
      rows.push(['', '']);
      rows.push(['Category', 'Deflection rate (%)']);
      advancedAnalytics.deflection_by_category.forEach((row) => {
        rows.push([row.category, row.deflection_rate_percent ?? 'N/A']);
      });
    }
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Metrics for your workspace (active team and tickets you can access)</p>
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
        <AnalyticsPageSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0 }}>
              <Card>
                <div className="p-6">
                  <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 mb-3" />
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalTickets.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Tickets
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                    <Activity className="w-3.5 h-3.5 mr-1" />
                    {analytics.open_tickets} open · {analytics.closed_tickets} closed
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
              <Card>
                <div className="p-6">
                  <CheckCircle className="w-5 h-5 text-gray-400 dark:text-gray-500 mb-3" />
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {resolutionRate}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Resolution Rate
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {analytics.closed_tickets} resolved
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
              <Card>
                <div className="p-6">
                  <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mb-3" />
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatResolutionTime(analytics.avg_resolution_time_seconds)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Resolution Time
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Average duration
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
              <Card>
                <div className="p-6">
                  <Star className="w-5 h-5 text-gray-400 dark:text-gray-500 mb-3" />
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {satisfactionScore != null ? `${satisfactionScore}/5` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Satisfaction
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {satisfactionScore != null ? 'From feedback' : 'No data yet'}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <ResolutionAnalytics />

          {advancedAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    Deflection by category
                  </h3>
                  {advancedAnalytics.deflection_by_category?.length ? (
                    <ul className="mt-4 space-y-2">
                      {advancedAnalytics.deflection_by_category.slice(0, 8).map((row) => (
                        <li key={row.category} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{row.category}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {row.deflection_rate_percent != null ? `${row.deflection_rate_percent}%` : '—'}
                            <span className="text-xs text-gray-500 ml-1">({row.agent_processed_count})</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">No agent-processed tickets yet</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    Confidence calibration
                  </h3>
                  {advancedAnalytics.confidence_calibration?.length ? (
                    <ul className="mt-4 space-y-2">
                      {advancedAnalytics.confidence_calibration.map((row) => (
                        <li key={row.confidence_bucket} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{row.confidence_bucket}</span>
                            <span className="text-xs text-gray-500">{row.samples} samples</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            Resolved w/o escalation: {row.resolved_without_escalation_rate_percent ?? '—'}%
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">No confidence logs yet</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Workflow bottlenecks
                  </h3>
                  {advancedAnalytics.workflow_bottlenecks?.length ? (
                    <ul className="mt-4 space-y-2">
                      {advancedAnalytics.workflow_bottlenecks.slice(0, 6).map((row) => (
                        <li key={row.step_title} className="text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-600 dark:text-gray-400 truncate">{row.step_title}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                              {row.overdue_now > 0 ? `${row.overdue_now} overdue` : `${row.active_now} active`}
                            </span>
                          </div>
                          {row.median_hours_from_workflow_start != null && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Median {row.median_hours_from_workflow_start}h from start
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">No workflow steps yet</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-dashed border-gray-300 dark:border-gray-600">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Tracking</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Real-time metrics and KPIs for resolution times and agent performance
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">Coming soon</p>
              </div>
            </Card>
            <Card className="border border-dashed border-gray-300 dark:border-gray-600">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Historical trends to identify patterns and optimize support
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">Coming soon</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
