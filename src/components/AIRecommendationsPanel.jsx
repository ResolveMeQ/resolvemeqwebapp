import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, ExternalLink, X } from 'lucide-react';
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
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />;
      case 'suggested_solution':
        return <Zap className="h-4 w-4 text-amber-600 dark:text-amber-500" />;
      case 'similar_tickets':
        return <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* AI Agent Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Agent Status</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Autonomous resolution engine</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-md">
            <div className="h-1.5 w-1.5 bg-green-600 dark:bg-green-400 rounded-full"></div>
            <span className="text-xs font-semibold uppercase tracking-wide">Active</span>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Processing</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics.agent_processing_rate}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Success</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics.resolution_success_rate}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Confidence</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {(analytics.average_confidence_score * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Autonomous</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
                {analytics.autonomous_solutions}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Recommendations List */}
      {recommendations.length > 0 && visibleCount > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
            <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
              {visibleCount} active
            </span>
          </div>

          <div className="space-y-3">
            {visibleRecommendations.slice(0, 5).map((rec) => (
              <div key={rec.ticket_id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-150">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-500">
                        #{rec.ticket_id}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {rec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="capitalize">{rec.category}</span>
                      {rec.priority && (
                        <>
                          <span>·</span>
                          <span className={`font-medium ${
                            rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                            rec.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {rec.priority}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleViewTicket(rec.ticket_id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors duration-150"
                      title="View ticket"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(rec.ticket_id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors duration-150"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {rec.recommendations.map((subRec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getRecommendationIcon(subRec.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">{subRec.message}</p>
                        {subRec.confidence && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {(subRec.confidence * 100).toFixed(0)}% confidence
                          </p>
                        )}
                      </div>
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
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                View all {visibleCount} recommendations
              </button>
            </div>
          )}
        </Card>
      )}

      {visibleCount === 0 && recommendations.length > 0 && (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">All recommendations reviewed</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">New suggestions will appear as tickets are analyzed</p>
        </Card>
      )}
      {recommendations.length === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No active recommendations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">The AI agent will suggest actions as it analyzes tickets</p>
        </Card>
      )}
    </>
  );
};

export default AIRecommendationsPanel;
