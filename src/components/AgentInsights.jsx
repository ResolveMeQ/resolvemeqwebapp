import { useState, useEffect } from 'react';
import { Brain, CheckCircle, AlertCircle, TrendingUp, Clock, Users, Lightbulb, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Button from './ui/Button';

const Card = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-none dark:border dark:border-gray-700 ${className || ''}`}>{children}</div>
);

const AgentInsights = ({ ticketId, onEscalate, onActionComplete }) => {
  const [agentStatus, setAgentStatus] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [applyingSolution, setApplyingSolution] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadAgentData();
    }
  }, [ticketId]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      const [statusData, suggestionsData] = await Promise.all([
        api.agent.getTicketAgentStatus(ticketId),
        api.agent.getTicketSuggestions(ticketId)
      ]);
      setAgentStatus(statusData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithAgent = async () => {
    try {
      setProcessing(true);
      await api.agent.processTicket(ticketId);
      setTimeout(() => {
        loadAgentData();
        setProcessing(false);
        onActionComplete?.();
      }, 3000);
    } catch (error) {
      console.error('Error processing ticket:', error);
      setProcessing(false);
    }
  };

  const handleApplySolution = async () => {
    const agentResponse = agentStatus?.agent_response || {};
    const solution = agentResponse.solution || {};
    const steps = solution.steps;
    if (!ticketId || !steps?.length) return;
    try {
      setApplyingSolution(true);
      const commentText = `AI suggested steps:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
      await api.tickets.addComment(ticketId, commentText);
      await api.tickets.updateStatus(ticketId, 'in_progress');
      onActionComplete?.();
    } catch (err) {
      console.error('Error applying solution:', err);
    } finally {
      setApplyingSolution(false);
    }
  };

  const handleEscalateClick = () => {
    if (typeof onEscalate === 'function') onEscalate(ticketId);
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

  const agentResponse = agentStatus?.agent_response || {};
  const analysis = agentResponse.analysis || {};
  const solution = agentResponse.solution || {};
  const assignment = agentResponse.assignment || {};
  const confidence = agentResponse.confidence || 0;

  return (
    <div className="space-y-4">
      {/* Agent Status Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agent Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {agentStatus?.agent_processed ? 'Analysis Complete' : 'Pending Analysis'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof onEscalate === 'function' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEscalateClick}
                className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                Escalate
              </Button>
            )}
            <Button
              onClick={handleProcessWithAgent}
              disabled={processing}
              loading={processing}
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {agentStatus?.agent_processed ? 'Re-analyze' : 'Analyze Now'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Confidence Score */}
      {confidence > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Confidence Score</h4>
            <span className={`text-2xl font-bold ${
              confidence >= 0.8 ? 'text-green-600' :
              confidence >= 0.6 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                confidence >= 0.8 ? 'bg-green-600' :
                confidence >= 0.6 ? 'bg-yellow-600' :
                'bg-red-600'
              }`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
        </Card>
      )}

      {/* Analysis Details */}
      {Object.keys(analysis).length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Analysis Details
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {analysis.priority && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Priority</div>
                <div className={`font-semibold capitalize ${
                  analysis.priority === 'high' ? 'text-red-600' :
                  analysis.priority === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {analysis.priority}
                </div>
              </div>
            )}
            {analysis.complexity && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Complexity</div>
                <div className="font-semibold capitalize">{analysis.complexity}</div>
              </div>
            )}
            {analysis.estimated_resolution_time && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Est. Time</div>
                <div className="font-semibold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {analysis.estimated_resolution_time}
                </div>
              </div>
            )}
            {analysis.suggested_category && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Category</div>
                <div className="font-semibold">{analysis.suggested_category}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Solution Steps */}
      {solution.steps && solution.steps.length > 0 && (
        <Card className="p-6 dark:bg-gray-800/50 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Suggested Solution
          </h4>
          <div className="space-y-3">
            {solution.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{step}</p>
              </div>
            ))}
          </div>
          {solution.success_probability && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Success Probability: {(solution.success_probability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApplySolution}
              disabled={applyingSolution}
              loading={applyingSolution}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Apply solution (add to ticket & set in progress)
            </Button>
          </div>
        </Card>
      )}

      {/* Assignment Suggestion */}
      {assignment.suggested_assignee && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Assignment Recommendation
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-medium text-gray-900">Suggested Team: {assignment.team}</div>
              <div className="text-sm text-gray-600 mt-1">{assignment.reason}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Similar Tickets */}
      {suggestions?.similar_tickets && suggestions.similar_tickets.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Similar Resolved Tickets</h4>
          <div className="space-y-2">
            {suggestions.similar_tickets.map((ticket) => (
              <div key={ticket.ticket_id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">#{ticket.ticket_id} - {ticket.issue_type}</div>
                    <div className="text-sm text-gray-600">{ticket.category}</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Analysis Message */}
      {!agentStatus?.agent_processed && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No AI Analysis Yet</h4>
          <p className="text-gray-600 mb-4">
            Click "Analyze Now" to get AI-powered insights and recommendations for this ticket.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AgentInsights;
