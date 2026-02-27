import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, ChevronRight, ExternalLink, X } from 'lucide-react';
import { api } from '../services/api';
import Card from './ui/Card';

const AIRecommendationsPanel = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const s = localStorage.getItem('ai_rec_dismissed');
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('ai_rec_dismissed');
    if (stored) {
      try {
        setDismissedIds(new Set(JSON.parse(stored)));
      } catch (_) {}
    }
  }, []);

  const handleDismiss = (ticketId) => {
    const next = new Set(dismissedIds);
    next.add(ticketId);
    setDismissedIds(next);
    try {
      localStorage.setItem('ai_rec_dismissed', JSON.stringify([...next]));
    } catch (_) {}
  };

  const handleViewTicket = (ticketId) => {
    navigate('/tickets', { state: ticketId ? { openTicketId: ticketId } : {} });
  };

  const visibleRecommendations = recommendations.filter((r) => !dismissedIds.has(r.ticket_id));
  const visibleCount = visibleRecommendations.length;

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recommendationsData, analyticsData] = await Promise.all([
        api.agent.getRecommendations(),
        api.agent.getAnalytics()
      ]);
      setRecommendations(
        Array.isArray(recommendationsData) ? recommendationsData : (recommendationsData?.recommendations || [])
      );
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      console.error('Error loading AI data:', err);
      setError('Failed to load AI recommendations');
      setRecommendations([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'high_confidence_solution':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'suggested_solution':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'similar_tickets':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'high_confidence_solution':
        return 'bg-green-50 border-green-200';
      case 'suggested_solution':
        return 'bg-yellow-50 border-yellow-200';
      case 'similar_tickets':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Agent Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agent Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time AI performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
            <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
            Active
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-lg border border-blue-100 dark:border-blue-800/60">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.agent_processing_rate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Processing Rate</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg border border-green-100 dark:border-green-800/60">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.resolution_success_rate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Success Rate</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/40 dark:to-violet-900/40 rounded-lg border border-purple-100 dark:border-purple-800/60">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(analytics.average_confidence_score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Avg Confidence</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/40 dark:to-amber-900/40 rounded-lg border border-orange-100 dark:border-orange-800/60">
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {analytics.autonomous_solutions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Auto Solutions</div>
            </div>
          </div>
        )}
      </Card>

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {visibleCount} suggestion{visibleCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {visibleRecommendations
              .slice(0, 5)
              .map((rec) => (
              <div key={rec.ticket_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{rec.ticket_id}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(rec.created_at).toLocaleDateString()}
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {rec.category}
                      </span>
                      {rec.priority && (
                        <span className={`px-2 py-0.5 rounded ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        }`}>
                          {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleViewTicket(rec.ticket_id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                      title="View ticket"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(rec.ticket_id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {rec.recommendations.map((subRec, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${getRecommendationColor(subRec.type)} dark:bg-gray-900/40`}
                    >
                      {getRecommendationIcon(subRec.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{subRec.message}</p>
                        {subRec.confidence && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Confidence: {(subRec.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewTicket(rec.ticket_id)}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View ticket
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {visibleCount > 5 && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleViewTicket()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                View all {visibleCount} recommendations →
              </button>
            </div>
          )}
        </Card>
      )}

      {visibleCount === 0 && recommendations.length > 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recommendations dismissed</h3>
          <p className="text-gray-600 dark:text-gray-400">You’ve dismissed all visible recommendations. New ones will appear as the agent analyzes tickets.</p>
        </Card>
      )}
      {recommendations.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-600 dark:text-gray-400">No immediate AI recommendations at this time.</p>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendationsPanel;
