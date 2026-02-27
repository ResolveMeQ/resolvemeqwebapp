import { useState } from 'react';
import { Search, Brain, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const Card = ({ children, className }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const EnhancedKBSearch = ({ onSelectArticle }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const data = await api.agent.searchKnowledgeBase(query, { limit: 10 });
      setResults(data);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getRelevanceLabel = (score) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search with AI-powered insights..."
              className="w-full pl-10 pr-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            <Search className="h-5 w-5" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {results && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">
                AI-Enhanced: {results.sources_used?.join(', ') || 'Multiple sources'}
              </span>
            </div>
            {results.search_time_ms && (
              <span className="text-gray-600">
                Found in {results.search_time_ms.toFixed(0)}ms
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {results.recommendations && results.recommendations.length > 0 ? (
            results.recommendations.map((rec, index) => {
              const article = rec.article || rec;
              return (
                <Card
                  key={article.kb_id || index}
                  className="p-5 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => onSelectArticle && onSelectArticle(article)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{article.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {article.content?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        {article.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {article.category}
                          </span>
                        )}
                        {article.tags && article.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {tag}
                          </span>
                        ))}
                        {rec.match_reason && (
                          <span className="text-gray-500 italic">
                            {rec.match_reason}
                          </span>
                        )}
                      </div>
                    </div>
                    {rec.relevance_score !== undefined && (
                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-2xl font-bold ${getRelevanceColor(rec.relevance_score)}`}>
                          {(rec.relevance_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {getRelevanceLabel(rec.relevance_score)} Match
                        </div>
                        {rec.confidence !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            {(rec.confidence * 100).toFixed(0)}% confidence
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h4>
              <p className="text-gray-600">
                Try adjusting your search terms or browse the knowledge base directly.
              </p>
            </Card>
          )}
        </div>
      )}

      {!results && !loading && (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Knowledge Search</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Search our knowledge base with advanced AI that understands context and finds the most relevant solutions.
          </p>
        </Card>
      )}
    </div>
  );
};

export default EnhancedKBSearch;
