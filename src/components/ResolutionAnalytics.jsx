import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { api } from '../services/api';

/**
 * ResolutionAnalytics Component
 * Displays analytics on resolution feedback and AI agent performance
 */
const ResolutionAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.analytics.getResolutionAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch resolution analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load resolution analytics
      </div>
    );
  }

  const successRate = analytics.success_rate || 0;
  const avgSatisfaction = analytics.average_satisfaction_score || 0;
  const pendingFeedback = analytics.total_resolutions - analytics.confirmed_successful - analytics.confirmed_failed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Resolution Analytics
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500 mb-3" />
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {analytics.total_resolutions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Resolutions
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Success Rate
            </div>
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {avgSatisfaction ? avgSatisfaction.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Avg Satisfaction
            </div>
            {avgSatisfaction && (
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-4 h-4 rounded-full ${
                      star <= Math.round(avgSatisfaction)
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    title={`${avgSatisfaction}/5`}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              {analytics.reopened_tickets}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reopened Tickets
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Issues not actually resolved
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Resolution Breakdown
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center py-2">
              <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-500 mx-auto mb-2" />
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {analytics.confirmed_successful}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Confirmed Successful
              </div>
            </div>
            <div className="text-center py-2">
              <XCircle className="w-8 h-8 text-error-600 dark:text-error-500 mx-auto mb-2" />
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {analytics.confirmed_failed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Confirmed Failed
              </div>
            </div>
            <div className="text-center py-2">
              <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {pendingFeedback}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Pending Feedback
              </div>
            </div>
          </div>
        </div>
      </Card>

      {analytics.action_type_breakdown && analytics.action_type_breakdown.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Success Rate by Action Type
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.action_type_breakdown.map((item) => {
                const rate = item.total > 0 ? ((item.confirmed / item.total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.autonomous_action}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.autonomous_action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.confirmed}/{item.total} ({rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResolutionAnalytics;
