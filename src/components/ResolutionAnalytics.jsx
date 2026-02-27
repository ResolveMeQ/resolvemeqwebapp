import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Star, BarChart3 } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load resolution analytics
      </div>
    );
  }

  const successRate = analytics.success_rate || 0;
  const avgSatisfaction = analytics.average_satisfaction_score || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Resolution Analytics
        </h2>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Resolutions
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {analytics.total_resolutions}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {successRate.toFixed(1)}%
              </p>
            </div>
            {successRate >= 80 ? (
              <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Satisfaction
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {avgSatisfaction ? avgSatisfaction.toFixed(1) : 'N/A'}
              </p>
            </div>
            <Star className={`w-12 h-12 ${avgSatisfaction >= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
          </div>
          {avgSatisfaction && (
            <div className="flex mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(avgSatisfaction)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Reopened Tickets
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {analytics.reopened_tickets}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Issues not actually resolved
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Resolution Breakdown
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2 dark:text-green-400" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.confirmed_successful}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confirmed Successful
              </p>
            </div>
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2 dark:text-red-400" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.confirmed_failed}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confirmed Failed
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-2 dark:text-blue-400" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.total_resolutions - analytics.confirmed_successful - analytics.confirmed_failed}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending Feedback
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Type Breakdown */}
      {analytics.action_type_breakdown && analytics.action_type_breakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          rate >= 80 ? 'bg-green-600' :
                          rate >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionAnalytics;
