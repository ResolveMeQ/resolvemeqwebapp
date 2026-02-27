import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  Calendar,
  RefreshCw,
  X,
  Filter,
  ChevronDown,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [toast, setToast] = useState(null);
  const [ratingArticleId, setRatingArticleId] = useState(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const TAGS_VISIBLE_COLLAPSED = 12;
  const [panelWidth, setPanelWidth] = useState(420);

  useEffect(() => {
    const updatePanelWidth = () =>
      setPanelWidth(window.innerWidth < 640 ? window.innerWidth : 420);
    updatePanelWidth();
    window.addEventListener('resize', updatePanelWidth);
    return () => window.removeEventListener('resize', updatePanelWidth);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedTags, articles, sortBy]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await api.knowledgeBase.list();
      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      setArticles(list);
      const tags = new Set();
      list.forEach((article) => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach((t) => tags.add(t));
        }
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
      showToast('Failed to load articles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];
    const q = (searchQuery || '').toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.content || '').toLowerCase().includes(q) ||
          (a.tags || []).some((t) => String(t).toLowerCase().includes(q))
      );
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (a) => a.tags && a.tags.some((t) => selectedTags.includes(t))
      );
    }
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'helpful':
        filtered.sort((a, b) => {
          const score = (art) =>
            (art.total_votes > 0 ? art.helpful_votes / art.total_votes : 0);
          return score(b) - score(a);
        });
        break;
      case 'recent':
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        break;
    }
    setFilteredArticles(filtered);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const openArticle = (article) => {
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
  };

  const getHelpfulnessScore = (article) => {
    if (!article?.total_votes) return 0;
    return Math.round((article.helpful_votes / article.total_votes) * 100);
  };

  const handleRate = async (articleId, isHelpful) => {
    setRatingArticleId(articleId);
    try {
      await api.knowledgeBase.rate(articleId, isHelpful);
      setArticles((prev) =>
        prev.map((a) => {
          if (a.kb_id !== articleId) return a;
          const total = (a.total_votes || 0) + 1;
          const helpful = (a.helpful_votes || 0) + (isHelpful ? 1 : 0);
          return { ...a, total_votes: total, helpful_votes: helpful };
        })
      );
      if (selectedArticle?.kb_id === articleId) {
        const total = (selectedArticle.total_votes || 0) + 1;
        const helpful = (selectedArticle.helpful_votes || 0) + (isHelpful ? 1 : 0);
        setSelectedArticle({
          ...selectedArticle,
          total_votes: total,
          helpful_votes: helpful,
        });
      }
      showToast(isHelpful ? 'Thanks for your feedback.' : 'Feedback recorded.');
    } catch (err) {
      showToast(err?.message || 'Failed to submit rating.', 'error');
    } finally {
      setRatingArticleId(null);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-8rem)] lg:min-h-[500px]">
      {/* Left: list and filters - always visible */}
      <div className="flex-1 min-w-0 flex flex-col space-y-6 p-6 overflow-y-auto scrollbar-hide">
        <header>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Search articles and solutions. Rate what helps.
          </p>
        </header>

      {/* Toolbar: search, sort, tags */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="recent">Most recent</option>
            <option value="popular">Most popular</option>
            <option value="helpful">Most helpful</option>
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadArticles}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
          {(tagsExpanded ? allTags : allTags.slice(0, TAGS_VISIBLE_COLLAPSED)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
          {allTags.length > TAGS_VISIBLE_COLLAPSED && (
            <button
              type="button"
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {tagsExpanded ? 'Show less' : `+${allTags.length - TAGS_VISIBLE_COLLAPSED} more tags`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tagsExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Active:</span>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:opacity-80"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Articles grid */}
      {loading && articles.length === 0 ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card className="p-12 text-center border border-gray-200 dark:border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            No articles found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Try a different search or clear filters.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.kb_id}
                className="p-5 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:bg-gray-800/50 dark:border-gray-700"
                onClick={() => openArticle(article)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h3>
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-3">
                  {article.content}
                </p>
                {article.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                      >
                        {t}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        +{article.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {article.views ?? 0}
                    </span>
                    <span>{getHelpfulnessScore(article)}% helpful</span>
                  </div>
                  <span>{formatDate(article.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>

        </>
      )}

      {!loading && filteredArticles.length > 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredArticles.length} of {articles.length} articles
        </p>
      )}
      </div>

      {/* Right-side panel: article detail - only when an article is selected */}
      <AnimatePresence mode="wait">
        {selectedArticle && (
          <motion.div
            key="article-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 flex flex-col max-w-[100vw]"
            style={{ minHeight: 'inherit' }}
          >
            <div className="w-full min-w-[280px] max-w-[420px] h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                  {selectedArticle.title}
                </h2>
                <button
                  type="button"
                  onClick={closeArticle}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedArticle.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedArticle.views ?? 0} views
                  </span>
                  <span>
                    {getHelpfulnessScore(selectedArticle)}% helpful (
                    {selectedArticle.total_votes ?? 0} votes)
                  </span>
                </div>

                {selectedArticle.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 bg-gray-50/50 dark:bg-gray-900/30">
                    {selectedArticle.content}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
                    Was this article helpful?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRate(selectedArticle.kb_id, true)}
                      disabled={ratingArticleId === selectedArticle.kb_id}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRate(selectedArticle.kb_id, false)}
                      disabled={ratingArticleId === selectedArticle.kb_id}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200'
              : 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
