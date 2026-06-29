import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  MessageSquare,
  Plus,
  ArrowBigUp,
  ArrowBigDown,
  Check,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  Calendar,
  RefreshCw,
  X,
  Filter,
  ChevronDown,
  Share2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { KnowledgeBaseArticlesSkeleton } from '../components/ui/Skeleton';
import { renderMarkdown } from '../utils/markdown';
import { formatFileSize, resolveMediaUrl } from '../utils/media';

const MENTION_RE = /(?<![\\w@])@([A-Za-z0-9_.+-]{2,150})/g;

function getMentionQuery(text, caretPos) {
  const value = String(text ?? '');
  const pos = typeof caretPos === 'number' ? caretPos : value.length;
  const upto = value.slice(0, Math.max(0, pos));

  const lastBreak = Math.max(upto.lastIndexOf(' '), upto.lastIndexOf('\\n'), upto.lastIndexOf('\\t'));
  const segment = upto.slice(lastBreak + 1);
  const at = segment.lastIndexOf('@');
  if (at < 0) return null;

  const query = segment.slice(at + 1);
  if (!query || /[^A-Za-z0-9_.+-]/.test(query)) return null;
  if (query.length > 50) return null;

  const start = (lastBreak + 1) + at;
  const end = pos;
  return { query, start, end };
}

function CommunityAttachmentLinks({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a) => {
        const href = resolveMediaUrl(a.file_url);
        const sizeLabel = formatFileSize(a.file_size);
        if (!href) {
          return (
            <span
              key={a.id}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 max-w-full break-all inline-block"
              title="Attachment unavailable"
            >
              {a.original_name}
              {sizeLabel ? ` (${sizeLabel})` : ''}
            </span>
          );
        }
        return (
          <a
            key={a.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            download={a.original_name || undefined}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-primary-700 dark:text-primary-300 hover:underline max-w-full break-all inline-block"
          >
            {a.original_name}
            {sizeLabel ? ` (${sizeLabel})` : ''}
          </a>
        );
      })}
    </div>
  );
}

function renderTextWithMentions(text) {
  const value = String(text ?? '');
  const parts = [];
  let last = 0;
  for (const match of value.matchAll(MENTION_RE)) {
    const idx = match.index ?? 0;
    const token = match[0];
    const username = match[1];
    if (idx > last) parts.push(value.slice(last, idx));
    parts.push(
      <span
        key={`m-${idx}-${username}`}
        className="inline-flex items-center px-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
        title={`@${username}`}
      >
        {token}
      </span>
    );
    last = idx + token.length;
  }
  if (last < value.length) parts.push(value.slice(last));
  return parts.length ? parts : value;
}

/** Shared article body for desktop side panel and mobile full-height sheet */
function ArticleDetailPanelContent({
  article,
  onClose,
  formatDate,
  getHelpfulnessScore,
  handleRate,
  ratingArticleId,
  sheetMode,
}) {
  if (!article) return null;
  const id = article.kb_id ?? article.id;
  return (
    <div className="w-full min-w-0 h-full flex flex-col overflow-hidden max-w-[420px] lg:max-w-none">
      <div
        className={cn(
          'px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0',
          sheetMode && 'pt-[max(0.75rem,env(safe-area-inset-top))]'
        )}
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate pr-2">
          {article.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent',
          sheetMode && 'pb-[max(1rem,env(safe-area-inset-bottom))]'
        )}
      >
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(article.created_at)}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {article.views ?? 0} views
          </span>
          <span>·</span>
          <span>{getHelpfulnessScore(article)}% helpful</span>
        </div>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((t, idx) => (
              <span
                key={`${t}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 rounded-md text-xs font-medium"
              >
                <Tag className="w-3 h-3" />
                {t}
              </span>
            ))}
          </div>
        )}

        <div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Was this helpful?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={ratingArticleId === id}
              disabled={ratingArticleId === id}
              onClick={() => handleRate(id, true)}
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              Yes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={ratingArticleId === id}
              disabled={ratingArticleId === id}
              onClick={() => handleRate(id, false)}
            >
              <ThumbsDown className="w-4 h-4 mr-1.5" />
              No
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const KnowledgeBase = ({ isAuthenticated = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mentionDebounceTimer, setMentionDebounceTimer] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('articles');
  const [toast, setToast] = useState(null);
  const [ratingArticleId, setRatingArticleId] = useState(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const TAGS_VISIBLE_COLLAPSED = 12;
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const [communityQuestions, setCommunityQuestions] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communitySort, setCommunitySort] = useState('active');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [communityTag, setCommunityTag] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState({ title: '', body: '', tags: '' });
  const [duplicateSuggestions, setDuplicateSuggestions] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [selectedDuplicateQuestion, setSelectedDuplicateQuestion] = useState(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerSort, setAnswerSort] = useState('top');
  const [communityDetailOpen, setCommunityDetailOpen] = useState(false);
  const [questionFiles, setQuestionFiles] = useState([]);
  const [answerFiles, setAnswerFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [openingQuestionId, setOpeningQuestionId] = useState(null);

  // Mentions (autocomplete)
  const [mentionState, setMentionState] = useState({
    open: false,
    loading: false,
    items: [],
    query: '',
    error: '',
    fieldKey: '',
    range: null,
    activeIndex: 0,
  });

  const closeMentions = useCallback(() => {
    setMentionState((s) => ({
      ...s,
      open: false,
      loading: false,
      items: [],
      query: '',
      error: '',
      fieldKey: '',
      range: null,
      activeIndex: 0,
    }));
  }, []);

  const requestMentions = useCallback(
    async ({ query, fieldKey, range }) => {
      if (!isAuthenticated) return;
      if (!query || query.length < 2) return;
      setMentionState((s) => ({
        ...s,
        open: true,
        loading: true,
        query,
        error: '',
        fieldKey,
        range,
        activeIndex: 0,
      }));
      try {
        const data = await api.users.mentionSuggestions(query);
        const list = Array.isArray(data) ? data : [];
        setMentionState((s) => ({
          ...s,
          open: true,
          loading: false,
          items: list.slice(0, 20),
          activeIndex: 0,
        }));
      } catch (e) {
        const msg =
          (e && typeof e === 'object' && 'message' in e && e.message) ? String(e.message) : 'Unable to load suggestions.';
        setMentionState((s) => ({
          ...s,
          open: true,
          loading: false,
          items: [],
          error: msg,
        }));
      }
    },
    [isAuthenticated]
  );

  const applyMention = useCallback(
    (userObj) => {
      const username = (userObj?.username || '').trim();
      if (!username) return;
      const { fieldKey, range } = mentionState;
      if (!fieldKey || !range) return;

      const replace = (text) => {
        const value = String(text ?? '');
        const before = value.slice(0, range.start);
        const after = value.slice(range.end);
        return `${before}@${username} ${after}`;
      };

      if (fieldKey === 'question.title') {
        setQuestionDraft((p) => ({ ...p, title: replace(p.title) }));
      } else if (fieldKey === 'question.body') {
        setQuestionDraft((p) => ({ ...p, body: replace(p.body) }));
      } else if (fieldKey === 'answer.body') {
        setAnswerDraft((p) => replace(p));
      } else if (fieldKey.startsWith('comment.')) {
        const key = fieldKey.slice('comment.'.length);
        setCommentDrafts((p) => ({ ...p, [key]: replace(p[key]) }));
      }

      closeMentions();
    },
    [mentionState, closeMentions]
  );

  const onMaybeMention = useCallback(
    ({ fieldKey, text, caretPos }) => {
      if (!isAuthenticated) return;
      const info = getMentionQuery(text, caretPos);
      if (!info) {
        closeMentions();
        return;
      }
      requestMentions({
        query: info.query,
        fieldKey,
        range: { start: info.start, end: info.end },
      });
    },
    [isAuthenticated, closeMentions, requestMentions]
  );

  useEffect(() => {
    if (!mentionState.open) return;
    const onKeyDown = (e) => {
      if (!mentionState.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentions();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState((s) => ({
          ...s,
          activeIndex: Math.min((s.activeIndex ?? 0) + 1, Math.max(0, (s.items?.length ?? 1) - 1)),
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState((s) => ({ ...s, activeIndex: Math.max((s.activeIndex ?? 0) - 1, 0) }));
      }
      if (e.key === 'Enter' && mentionState.items?.length) {
        // Only intercept Enter when the mention picker is open; click/submit is handled elsewhere.
        e.preventDefault();
        const idx = mentionState.activeIndex ?? 0;
        const picked = mentionState.items[idx];
        if (picked) applyMention(picked);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mentionState.open, mentionState.items, mentionState.activeIndex, closeMentions, applyMention]);

  useEffect(() => {
    return () => {
      if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
    };
  }, [mentionDebounceTimer]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const requireAuthAction = useCallback(
    (actionLabel = 'perform this action') => {
      if (isAuthenticated) return true;
      showToast(`Please sign in to ${actionLabel}.`, 'error');
      const next = `${location.pathname}${location.search || ''}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return false;
    },
    [isAuthenticated, showToast, navigate, location.pathname, location.search]
  );

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    const raw = (searchParams.get('q') || '').trim();
    const q = raw === 'undefined' || raw === 'null' ? '' : raw;
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const requestedView = (searchParams.get('view') || '').trim().toLowerCase();
    if (requestedView === 'community') {
      setViewMode('community');
    } else if (requestedView === 'articles') {
      setViewMode('articles');
    }
  }, [searchParams]);

  useEffect(() => {
    const tag = (searchParams.get('tag') || '').trim();
    setCommunityTag(tag);
  }, [searchParams]);

  const kbOpenParam = searchParams.get('kb');

  useEffect(() => {
    const id = (kbOpenParam || '').trim();
    if (!id || viewMode !== 'articles') return;
    let cancelled = false;
    (async () => {
      try {
        const article = await api.knowledgeBase.get(id);
        if (!cancelled && article) setSelectedArticle(article);
      } catch {
        /* deleted or unknown id */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kbOpenParam, viewMode]);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedTags, articles, sortBy]);

  useEffect(() => {
    if (viewMode !== 'community') return;
    loadCommunityQuestions();
  }, [viewMode, searchQuery, communitySort, communityFilter, communityTag]);

  useEffect(() => {
    if (!creatingQuestion) {
      setDuplicateSuggestions([]);
      setSelectedDuplicateQuestion(null);
      return;
    }
    const title = (questionDraft.title || '').trim();
    if (title.length < 4) {
      setDuplicateSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicates(true);
        const matches = await api.knowledgeBase.listCommunityQuestions({
          q: title,
          sort: 'votes',
          filter: 'all',
        });
        setDuplicateSuggestions((Array.isArray(matches) ? matches : []).slice(0, 4));
      } catch {
        setDuplicateSuggestions([]);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [creatingQuestion, questionDraft.title]);

  useEffect(() => {
    const qid = (searchParams.get('question') || '').trim();
    if (!qid || viewMode !== 'community') return;
    loadCommunityQuestionDetail(Number(qid));
  }, [searchParams, viewMode]);

  useEffect(() => {
    if (isDesktop) {
      setCommunityDetailOpen(false);
    }
  }, [isDesktop]);

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
    const id = article.kb_id ?? article.id;
    if (id != null && id !== '') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('kb', String(id));
          return next;
        },
        { replace: true }
      );
    }
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('kb');
        return next;
      },
      { replace: true }
    );
  };

  const getHelpfulnessScore = (article) => {
    if (!article?.total_votes) return 0;
    return Math.round((article.helpful_votes / article.total_votes) * 100);
  };

  const handleRate = async (articleId, isHelpful) => {
    if (!requireAuthAction('rate articles')) return;
    const id = articleId ?? selectedArticle?.kb_id ?? selectedArticle?.id;
    if (!id) return;
    setRatingArticleId(id);
    try {
      await api.knowledgeBase.rate(id, isHelpful);
      setArticles((prev) =>
        prev.map((a) => {
          if ((a.kb_id ?? a.id) !== id) return a;
          const total = (a.total_votes || 0) + 1;
          const helpful = (a.helpful_votes || 0) + (isHelpful ? 1 : 0);
          return { ...a, total_votes: total, helpful_votes: helpful };
        })
      );
      if ((selectedArticle?.kb_id ?? selectedArticle?.id) === id) {
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
      console.error('KB rate error:', err);
      showToast(err?.message || 'Failed to submit rating. Please try again.', 'error');
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

  const slugifyTitle = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120) || 'question';

  const buildCommunityPublicPath = (question) => {
    if (!question?.id) return '/knowledge-base?view=community';
    return `/community/q/${slugifyTitle(question.title)}-${question.id}`;
  };

  // Strip markdown formatting for preview text
  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
      .replace(/`(.+?)`/g, '$1') // Remove inline code
      .replace(/>\s+/g, '') // Remove blockquotes
      .replace(/[-*+]\s+/g, '') // Remove list markers
      .replace(/\d+\.\s+/g, '') // Remove numbered list markers
      .trim();
  };

  const updateViewMode = (mode) => {
    setViewMode(mode);
    if (mode !== 'community') {
      setCommunityDetailOpen(false);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', mode);
        if (mode !== 'community') {
          next.delete('question');
        }
        if (mode !== 'articles') {
          next.delete('kb');
        }
        return next;
      },
      { replace: true }
    );
  };

  const loadCommunityQuestions = async () => {
    try {
      setCommunityLoading(true);
      const q = (searchQuery || '').trim();
      const data = await api.knowledgeBase.listCommunityQuestions({
        q: q && q !== 'undefined' && q !== 'null' ? q : undefined,
        sort: communitySort,
        filter: communityFilter,
        tag: communityTag || undefined,
      });
      setCommunityQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading community questions:', error);
      setCommunityQuestions([]);
      showToast('Failed to load community Q&A.', 'error');
    } finally {
      setCommunityLoading(false);
    }
  };

  const applyCommunityTag = (tag) => {
    const safe = String(tag || '').trim();
    setCommunityTag(safe);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', 'community');
        if (safe) next.set('tag', safe);
        else next.delete('tag');
        return next;
      },
      { replace: true }
    );
  };

  const handleShareQuestion = async (question) => {
    const url = `${window.location.origin}${buildCommunityPublicPath(question)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: question?.title || 'Community question', url });
        showToast('Question shared.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Question link copied.');
      } else {
        showToast('Share not supported in this browser.', 'error');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const loadCommunityQuestionDetail = async (id) => {
    if (!id || Number.isNaN(id)) return;
    try {
      const data = await api.knowledgeBase.getCommunityQuestion(id);
      setSelectedQuestion(data);
    } catch {
      setSelectedQuestion(null);
    }
  };

  const openCommunityQuestion = async (question) => {
    try {
      setOpeningQuestionId(question.id);
      if (!isDesktop) {
        setCommunityDetailOpen(true);
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('view', 'community');
          next.set('question', String(question.id));
          return next;
        },
        { replace: true }
      );
      await loadCommunityQuestionDetail(question.id);
    } finally {
      setOpeningQuestionId(null);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!requireAuthAction('post a question')) return;
    const tags = (questionDraft.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      setUploadingFiles(true);
      const uploadedAttachments = [];
      for (const file of questionFiles) {
        const uploaded = await api.knowledgeBase.uploadCommunityAttachment(file);
        uploadedAttachments.push(uploaded);
      }
      const created = await api.knowledgeBase.createCommunityQuestion({
        title: questionDraft.title.trim(),
        body: questionDraft.body.trim(),
        tags,
        attachment_ids: uploadedAttachments.map((a) => a.id),
        duplicate_of: selectedDuplicateQuestion?.id || null,
        duplicate_note: selectedDuplicateQuestion
          ? "Marked as potential duplicate during authoring."
          : "",
      });
      setQuestionDraft({ title: '', body: '', tags: '' });
      setQuestionFiles([]);
      setSelectedDuplicateQuestion(null);
      setCreatingQuestion(false);
      showToast('Question posted.');
      await loadCommunityQuestions();
      await openCommunityQuestion(created);
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
    } catch (error) {
      showToast(error?.message || 'Failed to post question.', 'error');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleVoteQuestion = async (id, value) => {
    if (!requireAuthAction('vote')) return;
    const actionKey = `vote-question-${id}-${value}`;
    try {
      setActionLoadingKey(actionKey);
      const result = await api.knowledgeBase.voteCommunityQuestion(id, value);
      if (selectedQuestion?.id === id) {
        setSelectedQuestion((prev) =>
          prev
            ? {
                ...prev,
                score: typeof result?.score === 'number' ? result.score : prev.score,
                user_vote: result?.user_vote ?? value,
              }
            : prev
        );
      }
      setCommunityQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                score: typeof result?.score === 'number' ? result.score : q.score,
                user_vote: result?.user_vote ?? value,
              }
            : q
        )
      );
      await Promise.all([loadCommunityQuestions(), loadCommunityQuestionDetail(id)]);
      showToast(value > 0 ? 'Question upvoted.' : 'Question downvoted.');
    } catch (error) {
      showToast(error?.message || 'Unable to vote.', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleVoteAnswer = async (id, value) => {
    if (!requireAuthAction('vote')) return;
    if (!selectedQuestion) return;
    const actionKey = `vote-answer-${id}-${value}`;
    try {
      setActionLoadingKey(actionKey);
      const result = await api.knowledgeBase.voteCommunityAnswer(id, value);
      setSelectedQuestion((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: (prev.answers || []).map((a) =>
            a.id === id
              ? {
                  ...a,
                  score: typeof result?.score === 'number' ? result.score : a.score,
                  user_vote: result?.user_vote ?? value,
                }
              : a
          ),
        };
      });
      await loadCommunityQuestionDetail(selectedQuestion.id);
      showToast(value > 0 ? 'Answer upvoted.' : 'Answer downvoted.');
    } catch (error) {
      showToast(error?.message || 'Unable to vote.', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    if (!requireAuthAction('post an answer')) return;
    if (!selectedQuestion) return;
    try {
      setUploadingFiles(true);
      const uploadedAttachments = [];
      for (const file of answerFiles) {
        const uploaded = await api.knowledgeBase.uploadCommunityAttachment(file);
        uploadedAttachments.push(uploaded);
      }
      await api.knowledgeBase.addCommunityAnswer(selectedQuestion.id, {
        body: answerDraft.trim(),
        attachment_ids: uploadedAttachments.map((a) => a.id),
      });
      setAnswerDraft('');
      setAnswerFiles([]);
      showToast('Answer posted.');
      await Promise.all([loadCommunityQuestions(), loadCommunityQuestionDetail(selectedQuestion.id)]);
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
    } catch (error) {
      showToast(error?.message || 'Unable to post answer.', 'error');
    } finally {
      setUploadingFiles(false);
    }
  };

  const submitComment = async (targetType, id) => {
    if (!requireAuthAction('comment')) return;
    const key = `${targetType}-${id}`;
    const text = (commentDrafts[key] || '').trim();
    if (!text) {
      showToast('Write a comment before posting.', 'error');
      return;
    }
    const actionKey = `comment-${key}`;
    try {
      setActionLoadingKey(actionKey);
      if (targetType === 'question') {
        await api.knowledgeBase.addCommunityQuestionComment(id, { body: text });
      } else {
        await api.knowledgeBase.addCommunityAnswerComment(id, { body: text });
      }
      setCommentDrafts((prev) => ({ ...prev, [key]: '' }));
      await loadCommunityQuestionDetail(selectedQuestion.id);
      showToast('Comment posted.');
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
    } catch (error) {
      showToast(error?.message || 'Unable to post comment.', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!requireAuthAction('accept an answer')) return;
    if (!selectedQuestion) return;
    const actionKey = `accept-answer-${answerId}`;
    try {
      setActionLoadingKey(actionKey);
      await api.knowledgeBase.acceptCommunityAnswer(answerId);
      showToast('Accepted answer updated.');
      await loadCommunityQuestionDetail(selectedQuestion.id);
    } catch (error) {
      showToast(error?.message || 'Unable to accept answer.', 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const getSortedAnswers = () => {
    const answers = [...(selectedQuestion?.answers || [])];
    if (answerSort === 'newest') {
      return answers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return answers.sort((a, b) => {
      if ((a.is_accepted ? 1 : 0) !== (b.is_accepted ? 1 : 0)) {
        return (b.is_accepted ? 1 : 0) - (a.is_accepted ? 1 : 0);
      }
      if ((a.score || 0) !== (b.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  };

  const communityDetailPanel = !selectedQuestion ? (
    <p className="text-sm text-gray-500 dark:text-gray-400">Select a question to view details and answers.</p>
  ) : (
    <div className="space-y-4 min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-0 break-words pr-1">
          {selectedQuestion.title}
        </h2>
        <div className="flex flex-wrap items-center gap-1 shrink-0 sm:justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShareQuestion(selectedQuestion)}
            title="Share question"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-1.5">
            {selectedQuestion.score ?? 0}
          </span>
          <Button
            size="sm"
            variant={selectedQuestion.user_vote === 1 ? "primary" : "ghost"}
            onClick={() => handleVoteQuestion(selectedQuestion.id, 1)}
            loading={actionLoadingKey === `vote-question-${selectedQuestion.id}-1`}
            disabled={Boolean(actionLoadingKey)}
          >
            <ArrowBigUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={selectedQuestion.user_vote === -1 ? "primary" : "ghost"}
            onClick={() => handleVoteQuestion(selectedQuestion.id, -1)}
            loading={actionLoadingKey === `vote-question-${selectedQuestion.id}--1`}
            disabled={Boolean(actionLoadingKey)}
          >
            <ArrowBigDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {(selectedQuestion.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(selectedQuestion.tags || []).map((tag, idx) => (
            <button
              key={`${tag}-${idx}`}
              type="button"
              className="text-[11px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => applyCommunityTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
      {(selectedQuestion.comments || []).length > 0 && (
        <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            Comments
          </p>
          {(selectedQuestion.comments || []).map((comment) => (
            <div
              key={`q-comment-${comment.id}`}
              className="text-xs text-gray-700 dark:text-gray-300 break-words space-y-1"
            >
              <div>
                <span className="font-medium">{comment.author_name || 'User'}:</span>{' '}
                {renderTextWithMentions(comment.body)}
              </div>
              {(comment.attachments || []).length > 0 && (
                <CommunityAttachmentLinks attachments={comment.attachments} />
              )}
            </div>
          ))}
        </div>
      )}
      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
        {renderTextWithMentions(selectedQuestion.body)}
      </div>
      {selectedQuestion.duplicate_of && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-2.5">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
            This question is linked as a potential duplicate of:
          </p>
          <button
            type="button"
            className="mt-1 text-xs text-amber-800 dark:text-amber-200 hover:underline"
            onClick={() =>
              openCommunityQuestion({
                id: selectedQuestion.duplicate_of,
                title: selectedQuestion.duplicate_of_title || `Question #${selectedQuestion.duplicate_of}`,
              })
            }
          >
            {selectedQuestion.duplicate_of_title || `Question #${selectedQuestion.duplicate_of}`}
          </button>
        </div>
      )}
      {(selectedQuestion.attachments || []).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Attachments</p>
          <CommunityAttachmentLinks attachments={selectedQuestion.attachments} />
        </div>
      )}
      {selectedQuestion.has_accepted_answer && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <p className="text-xs font-medium text-emerald-900 dark:text-emerald-300 min-w-0">
            This question has an accepted answer.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              const node = document.getElementById(`kb-answer-accepted-${selectedQuestion.id}`);
              node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            Jump to accepted
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch min-w-0">
        <input
          value={commentDrafts[`question-${selectedQuestion.id}`] || ''}
          onChange={(e) => {
            const v = e.target.value;
            setCommentDrafts((p) => ({ ...p, [`question-${selectedQuestion.id}`]: v }));
            const caret = e.target.selectionStart;
            if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
            const t = window.setTimeout(() => {
              onMaybeMention({ fieldKey: `comment.question-${selectedQuestion.id}`, text: v, caretPos: caret });
            }, 160);
            setMentionDebounceTimer(t);
          }}
          placeholder="Add a comment to question"
          className="w-full min-w-0 sm:flex-1 px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
        />
        <Button
          size="sm"
          variant="ghost"
          className="w-full sm:w-auto shrink-0"
          onClick={() => submitComment('question', selectedQuestion.id)}
          loading={actionLoadingKey === `comment-question-${selectedQuestion.id}`}
          disabled={Boolean(actionLoadingKey)}
        >
          Comment
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-800 pt-3 min-w-0">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
          Answers ({selectedQuestion.answer_count ?? selectedQuestion.answers?.length ?? 0})
        </p>
        <select
          value={answerSort}
          onChange={(e) => setAnswerSort(e.target.value)}
          className="w-full sm:w-auto min-w-0 max-w-full px-2 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
        >
          <option value="top">Top answers</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      <div className="space-y-3">
        {getSortedAnswers().map((answer) => (
          <div
            key={answer.id}
            id={answer.is_accepted ? `kb-answer-accepted-${selectedQuestion.id}` : undefined}
            className={cn(
              "rounded-lg border p-3 space-y-2 min-w-0 overflow-hidden",
              answer.is_accepted
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10"
                : "border-gray-200 dark:border-gray-800"
            )}
          >
            <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                {answer.is_accepted && (
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Accepted answer
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {renderTextWithMentions(answer.body)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1 shrink-0 border-t border-gray-200/80 dark:border-gray-800/80 pt-2 sm:border-0 sm:pt-0 sm:justify-start">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-1.5">
                  {answer.score ?? 0}
                </span>
                <Button
                  size="sm"
                  variant={answer.user_vote === 1 ? "primary" : "ghost"}
                  onClick={() => handleVoteAnswer(answer.id, 1)}
                  loading={actionLoadingKey === `vote-answer-${answer.id}-1`}
                  disabled={Boolean(actionLoadingKey)}
                >
                  <ArrowBigUp className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={answer.user_vote === -1 ? "primary" : "ghost"}
                  onClick={() => handleVoteAnswer(answer.id, -1)}
                  loading={actionLoadingKey === `vote-answer-${answer.id}--1`}
                  disabled={Boolean(actionLoadingKey)}
                >
                  <ArrowBigDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={answer.is_accepted ? 'primary' : 'outline'}
                  onClick={() => handleAcceptAnswer(answer.id)}
                  loading={actionLoadingKey === `accept-answer-${answer.id}`}
                  disabled={Boolean(actionLoadingKey)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {(answer.attachments || []).length > 0 && (
              <CommunityAttachmentLinks attachments={answer.attachments} />
            )}
            {(answer.comments || []).length > 0 && (
              <div className="space-y-1.5 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 p-2">
                {(answer.comments || []).map((comment) => (
                  <div
                    key={`a-comment-${answer.id}-${comment.id}`}
                    className="text-xs text-gray-700 dark:text-gray-300 break-words space-y-1"
                  >
                    <div>
                      <span className="font-medium">{comment.author_name || 'User'}:</span>{' '}
                      {renderTextWithMentions(comment.body)}
                    </div>
                    {(comment.attachments || []).length > 0 && (
                      <CommunityAttachmentLinks attachments={comment.attachments} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch min-w-0">
              <input
                value={commentDrafts[`answer-${answer.id}`] || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setCommentDrafts((p) => ({ ...p, [`answer-${answer.id}`]: v }));
                  const caret = e.target.selectionStart;
                  if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
                  const t = window.setTimeout(() => {
                    onMaybeMention({ fieldKey: `comment.answer-${answer.id}`, text: v, caretPos: caret });
                  }, 160);
                  setMentionDebounceTimer(t);
                }}
                placeholder="Add a comment"
                className="w-full min-w-0 sm:flex-1 px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                className="w-full sm:w-auto shrink-0"
                onClick={() => submitComment('answer', answer.id)}
                loading={actionLoadingKey === `comment-answer-${answer.id}`}
                disabled={Boolean(actionLoadingKey)}
              >
                Comment
              </Button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddAnswer} className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-3">
        <textarea
          value={answerDraft}
          onChange={(e) => {
            const v = e.target.value;
            setAnswerDraft(v);
            const caret = e.target.selectionStart;
            if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
            const t = window.setTimeout(() => {
              onMaybeMention({ fieldKey: 'answer.body', text: v, caretPos: caret });
            }, 160);
            setMentionDebounceTimer(t);
          }}
          rows={3}
          placeholder="Write your answer"
          className="w-full min-w-0 max-w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        />
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.json,.log,image/*,application/pdf,text/*"
                onChange={(e) => setAnswerFiles(Array.from(e.target.files || []))}
                className="w-full text-xs text-gray-600 dark:text-gray-300"
              />
        {answerFiles.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {answerFiles.length} attachment(s) selected
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={uploadingFiles} disabled={uploadingFiles}>
            Post Answer
          </Button>
        </div>
      </form>
      {communityQuestions.length > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            Related questions
          </p>
          <div className="space-y-1.5">
            {communityQuestions
              .filter((q) => q.id !== selectedQuestion.id)
              .filter((q) => {
                const selectedTags = (selectedQuestion.tags || []).map((t) => String(t).toLowerCase());
                const qTags = (q.tags || []).map((t) => String(t).toLowerCase());
                const overlap = selectedTags.some((t) => qTags.includes(t));
                return overlap || q.title?.toLowerCase().includes((selectedQuestion.title || '').toLowerCase().split(' ')[0] || '');
              })
              .slice(0, 4)
              .map((q) => (
                <button
                  key={`related-${q.id}`}
                  type="button"
                  className="w-full text-left text-xs px-2.5 py-2 rounded border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => openCommunityQuestion(q)}
                >
                  {q.title}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  if (viewMode === 'community') {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Community Q&A for internal contributors and public readers
            </p>
          </div>
          <div
            data-tour="kb-tabs"
            className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1"
          >
            <button
              type="button"
              onClick={() => updateViewMode('articles')}
              className="px-3 py-1.5 text-sm rounded-md text-gray-600 dark:text-gray-300"
            >
              Articles
            </button>
            <button
              type="button"
              onClick={() => updateViewMode('community')}
              className="px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white"
            >
              Community Q&A
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={communitySort}
            onChange={(e) => setCommunitySort(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          >
            <option value="active">Most active</option>
            <option value="votes">Top voted</option>
            <option value="newest">Newest</option>
            <option value="unanswered">Unanswered</option>
          </select>
          <select
            value={communityFilter}
            onChange={(e) => setCommunityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">All questions</option>
            <option value="unanswered">Only unanswered</option>
            <option value="accepted">Has accepted answer</option>
          </select>
          {communityTag && (
            <button
              type="button"
              onClick={() => applyCommunityTag('')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300"
              title="Clear tag filter"
            >
              Tag: #{communityTag} (clear)
            </button>
          )}
          <Button
            data-tour="kb-ask-question"
            variant="primary"
            onClick={() => setCreatingQuestion((v) => !v)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ask question
          </Button>
        </div>

        {creatingQuestion && (
          <Card className="p-4">
            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <input
                value={questionDraft.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuestionDraft((p) => ({ ...p, title: v }));
                  const caret = e.target.selectionStart;
                  if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
                  const t = window.setTimeout(() => {
                    onMaybeMention({ fieldKey: 'question.title', text: v, caretPos: caret });
                  }, 160);
                  setMentionDebounceTimer(t);
                }}
                placeholder="Question title"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tip: Use a specific title like "Windows 11 VPN disconnects every 10 minutes on office Wi-Fi".
              </p>
              {checkingDuplicates && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Checking similar questions...</p>
              )}
              {!checkingDuplicates && duplicateSuggestions.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 space-y-2">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                    Similar existing questions found:
                  </p>
                  {selectedDuplicateQuestion && (
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                      <span className="font-medium text-emerald-900 dark:text-emerald-300">
                        Marked duplicate of: {selectedDuplicateQuestion.title}
                      </span>
                      <button
                        type="button"
                        className="text-emerald-700 dark:text-emerald-300 hover:underline"
                        onClick={() => setSelectedDuplicateQuestion(null)}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  {duplicateSuggestions.map((q) => (
                    <div key={q.id} className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 text-left text-xs px-2 py-1.5 rounded border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100/80 dark:hover:bg-amber-900/30"
                        onClick={async () => {
                          setCreatingQuestion(false);
                          await openCommunityQuestion(q);
                        }}
                      >
                        {q.title}
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1.5 rounded border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30"
                        onClick={() => setSelectedDuplicateQuestion(q)}
                      >
                        Mark duplicate
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={questionDraft.body}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuestionDraft((p) => ({ ...p, body: v }));
                  const caret = e.target.selectionStart;
                  if (mentionDebounceTimer) window.clearTimeout(mentionDebounceTimer);
                  const t = window.setTimeout(() => {
                    onMaybeMention({ fieldKey: 'question.body', text: v, caretPos: caret });
                  }, 160);
                  setMentionDebounceTimer(t);
                }}
                placeholder="Describe your issue or question..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                required
              />
              <input
                value={questionDraft.tags}
                onChange={(e) => setQuestionDraft((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (comma-separated)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.md,.json,.log,image/*,application/pdf,text/*"
                onChange={(e) => setQuestionFiles(Array.from(e.target.files || []))}
                className="w-full text-xs text-gray-600 dark:text-gray-300"
              />
              {questionFiles.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {questionFiles.length} attachment(s) selected
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={uploadingFiles} disabled={uploadingFiles}>
                  Post Question
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr] gap-4">
          <div className="space-y-3">
            {communityLoading ? (
              <KnowledgeBaseArticlesSkeleton />
            ) : (
              (communityQuestions || []).map((question) => (
                <Card
                  key={question.id}
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-sm transition-all",
                    selectedQuestion?.id === question.id && "ring-2 ring-primary-500 border-primary-300 dark:border-primary-700"
                  )}
                  onClick={() => openCommunityQuestion(question)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{question.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {question.answer_count ?? 0} answers · {question.views ?? 0} views · score {question.score ?? 0}
                        {(question.attachments || []).length > 0
                          ? ` · ${question.attachments.length} attachment${question.attachments.length === 1 ? '' : 's'}`
                          : ''}
                      </p>
                      {(question.tags || []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(question.tags || []).slice(0, 4).map((tag, idx) => (
                            <button
                              key={`${question.id}-${tag}-${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyCommunityTag(tag);
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                      {question.duplicate_of_title && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                          Potential duplicate of: {question.duplicate_of_title}
                        </p>
                      )}
                    </div>
                    {openingQuestionId === question.id ? (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0">Opening...</span>
                    ) : (
                      <MessageSquare className="w-4 h-4 text-primary-500 shrink-0" />
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className={cn("p-4 min-h-[300px] min-w-0 overflow-x-hidden", !isDesktop && "hidden")}>
            {communityDetailPanel}
          </Card>
        </div>

        {!isDesktop &&
          createPortal(
            <AnimatePresence mode="sync">
              {communityDetailOpen && selectedQuestion && (
                <>
                  <motion.div
                    key="community-detail-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/45 dark:bg-black/60"
                    onClick={() => setCommunityDetailOpen(false)}
                    aria-hidden
                  />
                  <motion.aside
                    key="community-detail-sheet"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                    className="fixed top-0 right-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] sm:max-w-2xl flex-col overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl"
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-3">
                        Question details
                      </h2>
                      <button
                        type="button"
                        onClick={() => setCommunityDetailOpen(false)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        aria-label="Close question details"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      {communityDetailPanel}
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

        {mentionState.open &&
          isAuthenticated &&
          createPortal(
            <div
              className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-6 w-[min(560px,calc(100vw-2rem))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden"
              role="listbox"
              aria-label="Mention suggestions"
            >
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Mention: <span className="font-mono">@{mentionState.query}</span>
                </p>
                <button
                  type="button"
                  onClick={closeMentions}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Esc
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {mentionState.loading ? (
                  <div className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
                ) : mentionState.error ? (
                  <div className="px-3 py-3 text-sm text-red-700 dark:text-red-300">
                    {mentionState.error}
                  </div>
                ) : mentionState.items.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">No matches.</div>
                ) : (
                  mentionState.items.map((u, idx) => {
                    const active = idx === (mentionState.activeIndex ?? 0);
                    const label = (u.full_name || '').trim() || u.username || u.email || 'User';
                    return (
                      <button
                        key={u.id || `${u.username}-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setMentionState((s) => ({ ...s, activeIndex: idx }))}
                        onClick={() => applyMention(u)}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm",
                          active
                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="font-medium truncate block">{label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                            @{u.username}{u.email ? ` · ${u.email}` : ''}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Enter</span>
                      </button>
                    );
                  })
                )}
              </div>
              {!mentionState.loading && mentionState.items.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                  Use ↑ ↓ then Enter.
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-8rem)] lg:min-h-[500px]">
      {/* Left: list and filters */}
      <div className="flex-1 min-w-0 flex flex-col space-y-6 overflow-y-auto scrollbar-hide">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Search documentation and solutions
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
            <button
              type="button"
              onClick={() => updateViewMode('articles')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md",
                viewMode === "articles"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
              )}
            >
              Articles
            </button>
            <button
              type="button"
              onClick={() => updateViewMode('community')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md",
                viewMode === "community"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
              )}
            >
              Community Q&A
            </button>
          </div>
        </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
          <option value="recent">Most recent</option>
          <option value="popular">Most popular</option>
          <option value="helpful">Most helpful</option>
        </select>
        <Button
          variant="ghost"
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
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tags:</span>
          {(tagsExpanded ? allTags : allTags.slice(0, TAGS_VISIBLE_COLLAPSED)).map((tag, idx) => (
            <button
              key={`${tag}-${idx}`}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150',
                selectedTags.includes(tag)
                  ? 'bg-primary-600 text-white dark:bg-primary-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              )}
            >
              {tag}
            </button>
          ))}
          {allTags.length > TAGS_VISIBLE_COLLAPSED && (
            <button
              type="button"
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors duration-150"
            >
              {tagsExpanded ? 'Show less' : `+${allTags.length - TAGS_VISIBLE_COLLAPSED}`}
              <ChevronDown className={`w-3 h-3 transition-transform ${tagsExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Filtered by:</span>
          {selectedTags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 rounded-md text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:text-primary-900 dark:hover:text-primary-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Articles grid */}
      {loading && articles.length === 0 ? (
        <KnowledgeBaseArticlesSkeleton />
      ) : filteredArticles.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            No articles found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Try a different search or clear filters
          </p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <Card
                key={article.kb_id}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow duration-150"
                onClick={() => openArticle(article)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h3>
                  <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {stripMarkdown(article.content)}
                </p>
                {article.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {article.tags.slice(0, 3).map((t, idx) => (
                      <span
                        key={`${t}-${idx}`}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded text-xs"
                      >
                        {t}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 px-2 py-0.5">
                        +{article.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-200 dark:border-gray-800">
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
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 pt-2">
          Showing {filteredArticles.length} of {articles.length} articles
        </p>
      )}
      </div>

      {/* Desktop (lg+): article detail beside the list */}
      <AnimatePresence mode="wait">
        {selectedArticle && isDesktop && (
          <motion.div
            key="article-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="flex shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-col max-w-[100vw]"
            style={{ minHeight: 'inherit' }}
          >
            <ArticleDetailPanelContent
              article={selectedArticle}
              onClose={closeArticle}
              formatDate={formatDate}
              getHelpfulnessScore={getHelpfulnessScore}
              handleRate={handleRate}
              ratingArticleId={ratingArticleId}
              sheetMode={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile / tablet: full-height sheet from the right (portal stays mounted so exit animations run) */}
      {!isDesktop &&
        createPortal(
          <AnimatePresence mode="sync">
            {selectedArticle && (
              <>
                <motion.div
                  key="kb-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60"
                  onClick={closeArticle}
                  aria-hidden
                />
                <motion.aside
                  key="kb-sheet"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                  className="fixed top-0 right-0 z-50 flex h-[100dvh] max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl"
                >
                  <ArticleDetailPanelContent
                    article={selectedArticle}
                    onClose={closeArticle}
                    formatDate={formatDate}
                    getHelpfulnessScore={getHelpfulnessScore}
                    handleRate={handleRate}
                    ratingArticleId={ratingArticleId}
                    sheetMode
                  />
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {mentionState.open &&
        isAuthenticated &&
        createPortal(
          <div
            className="fixed z-[60] left-1/2 -translate-x-1/2 bottom-6 w-[min(560px,calc(100vw-2rem))] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden"
            role="listbox"
            aria-label="Mention suggestions"
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Mention: <span className="font-mono">@{mentionState.query}</span>
              </p>
              <button
                type="button"
                onClick={closeMentions}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Esc
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {mentionState.loading ? (
                <div className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
              ) : mentionState.error ? (
                <div className="px-3 py-3 text-sm text-red-700 dark:text-red-300">
                  {mentionState.error}
                </div>
              ) : mentionState.items.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">No matches.</div>
              ) : (
                mentionState.items.map((u, idx) => {
                  const active = idx === (mentionState.activeIndex ?? 0);
                  const label = (u.full_name || '').trim() || u.username || u.email || 'User';
                  return (
                    <button
                      key={u.id || `${u.username}-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setMentionState((s) => ({ ...s, activeIndex: idx }))}
                      onClick={() => applyMention(u)}
                      className={cn(
                        "w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm",
                        active
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="font-medium truncate block">{label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                          @{u.username}{u.email ? ` · ${u.email}` : ''}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Enter</span>
                    </button>
                  );
                })
              )}
            </div>
            {!mentionState.loading && mentionState.items.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400">
                Use ↑ ↓ then Enter.
              </div>
            )}
          </div>,
          document.body
        )}

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
