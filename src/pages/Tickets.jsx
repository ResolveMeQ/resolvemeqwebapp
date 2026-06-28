import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Zap,
  Sparkles,
  X,
  Lightbulb,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AgentInsights from '../components/AgentInsights';
import ActionHistory from '../components/ActionHistory';
import ResolutionFeedback from '../components/ResolutionFeedback';
import AIChatPanel from '../components/AIChatPanel';
import { api, TokenService, AgentQuotaExceededError, isAgentQuotaError } from '../services/api';
import { TICKET_CATEGORY_FALLBACK } from '../constants';
import { cn } from '../utils/cn';
import { getTicketNextStep } from '../utils/ticketUx';
import { TicketsPageSkeleton, TicketDetailPanelSkeleton, Skeleton } from '../components/ui/Skeleton';
import {
  IllustrationTicketsEmpty,
  IllustrationTicketsError,
  IllustrationQuota,
} from '../components/ui/ChatStateIllustrations';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/** Turn relative media paths from the API into an absolute URL for <img src>. */
function resolveTicketMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
  return u;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'pending_clarification', label: 'Needs info' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
];

/** Matches Slack + API `urgency` query; empty keeps legacy `issue_type` without "(urgency)" suffix. */
const URGENCY_CREATE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function categoryOptionsForSelect(categories, currentValue) {
  const known = new Set((categories || []).map((c) => c.value));
  const orphan =
    currentValue && !known.has(currentValue)
      ? [{ value: currentValue, label: `${currentValue} (legacy)` }]
      : [];
  return [...(categories || []), ...orphan];
}

const Tickets = ({ activeTeamId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTickets, setActiveTickets] = useState([]);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [communityHints, setCommunityHints] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editTicket, setEditTicket] = useState(null);
  const [editForm, setEditForm] = useState({ issue_type: '', description: '', category: '', status: 'new' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [saveEditLoading, setSaveEditLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(null);
  const [escalateModal, setEscalateModal] = useState({ open: false, ticketId: null });
  const [escalateForm, setEscalateForm] = useState({ reason: 'talk_to_human', note: '', phone: '', conversation_summary: '' });
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createAgentQuotaNotice, setCreateAgentQuotaNotice] = useState(null);
  const [createForm, setCreateForm] = useState({
    issue_type: '',
    description: '',
    category: 'other',
    urgency: '',
  });
  const [createScreenshotFile, setCreateScreenshotFile] = useState(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState(null);
  const [createDropActive, setCreateDropActive] = useState(false);
  const [screenshotLightboxUrl, setScreenshotLightboxUrl] = useState(null);
  const [ticketCategories, setTicketCategories] = useState(TICKET_CATEGORY_FALLBACK);
  const [toast, setToast] = useState(null);
  const toastSeq = useRef(0);
  const pendingScrollToCommentsRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const commentInputRef = useRef(null);

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false);
    setCreateScreenshotFile(null);
    setScreenshotPreviewUrl(null);
    setCreateDropActive(false);
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  }, []);

  const clearCreateScreenshot = useCallback(() => {
    setCreateScreenshotFile(null);
    setScreenshotPreviewUrl(null);
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastSeq.current;
    setToast({ id, message, type });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 4500);
  }, []);

  const scrollTicketCommentsIntoView = useCallback((delayMs = 360) => {
    window.setTimeout(() => {
      document.getElementById('ticket-comments-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      document.querySelector('#ticket-comments-section textarea, #ticket-comments-section input[type="text"]')?.focus();
    }, delayMs);
  }, []);

  useEffect(() => {
    if (!commentInputRef.current) return;
    commentInputRef.current.style.height = 'auto';
    commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 160)}px`;
  }, [commentText]);

  useEffect(() => {
    if (!createScreenshotFile) {
      setScreenshotPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(createScreenshotFile);
    setScreenshotPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [createScreenshotFile]);

  useEffect(() => {
    if (!detailTicket) setScreenshotLightboxUrl(null);
  }, [detailTicket]);

  useEffect(() => {
    if (!screenshotLightboxUrl) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setScreenshotLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screenshotLightboxUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.tickets.getCategories();
        const list = Array.isArray(res?.categories) ? res.categories : [];
        if (!cancelled && list.length > 0) setTicketCategories(list);
      } catch {
        if (!cancelled) setTicketCategories(TICKET_CATEGORY_FALLBACK);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDetailTicket(null);
    setCurrentTicket(null);
    setShowAIAgent(false);
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when workspace (active team) changes
  }, [activeTeamId]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setCommunityHints([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setCommunityLoading(true);
        const res = await api.tickets.search({ q });
        setCommunityHints(Array.isArray(res?.community_resolved) ? res.community_resolved : []);
      } catch {
        setCommunityHints([]);
      } finally {
        setCommunityLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTeamId]);

  useEffect(() => {
    const openId = location.state?.openTicketId;
    const focusComments = location.state?.focusComments;
    if (openId == null || activeTickets.length === 0) return;
    const want = Number(openId);
    const ticket = activeTickets.find((t) => Number(t.ticket_id ?? t.id) === want);
    if (ticket) {
      setDetailTicket(ticket);
      loadTicketDetail(want);
      if (focusComments) {
        pendingScrollToCommentsRef.current = want;
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openTicketId, location.state?.focusComments, activeTickets, location.pathname, navigate]);

  useEffect(() => {
    const wantId = pendingScrollToCommentsRef.current;
    if (wantId == null || !detailTicket || detailLoading) return;
    if (Number(detailTicket.ticket_id ?? detailTicket.id) !== Number(wantId)) return;
    pendingScrollToCommentsRef.current = null;
    const t = setTimeout(() => {
      document.getElementById('ticket-comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelector('#ticket-comments-section input[type="text"]')?.focus();
    }, 320);
    return () => clearTimeout(t);
  }, [detailLoading, detailTicket]);

  useEffect(() => {
    if (location.state?.openCreateForm) {
      setShowCreateForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreateForm, location.pathname, navigate]);

  const loadTickets = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const tickets = await api.tickets.list({ limit: 100 });
      setActiveTickets(Array.isArray(tickets) ? tickets : []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      if (!silent) {
        setError(err.message || 'Failed to load tickets');
        setActiveTickets([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId, { silent = false } = {}) => {
    if (!ticketId) return;
    if (!silent) setDetailLoading(true);
    try {
      const t = await api.tickets.get(ticketId);
      setDetailTicket(t);
    } catch (err) {
      console.error('Error loading ticket:', err);
      if (!silent) setDetailTicket(null);
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  const handleViewDetail = (ticket) => {
    const id = ticket.ticket_id ?? ticket.id;
    setDetailTicket(ticket);
    loadTicketDetail(id);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setUpdatingStatus(ticketId);
    const previousStatus =
      detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId
        ? detailTicket.status
        : activeTickets.find((t) => (t.ticket_id ?? t.id) === ticketId)?.status;
    try {
      const res = await api.tickets.updateStatus(ticketId, newStatus);
      const canonicalStatus = res?.ticket?.status ?? newStatus;
      setActiveTickets((prev) =>
        prev.map((t) =>
          (t.ticket_id ?? t.id) === ticketId ? { ...t, ...(res?.ticket || {}), status: canonicalStatus } : t
        )
      );
      if (detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId) {
        setDetailTicket((prev) => (prev ? { ...prev, ...(res?.ticket || {}), status: canonicalStatus } : null));
      }
      if (canonicalStatus === 'resolved' || canonicalStatus === 'escalated') {
        window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
      }
      if (previousStatus !== canonicalStatus) {
        if (canonicalStatus === 'resolved') {
          showToast('Ticket marked resolved.', 'success');
        } else if (canonicalStatus === 'escalated') {
          showToast('Ticket escalated. Support will review it — updates appear here and by email.', 'info');
        } else {
          showToast(`Status updated to ${canonicalStatus.replace(/_/g, ' ')}.`, 'info');
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openEscalate = (ticketId, { conversation_summary } = {}) => {
    if (!ticketId) return;
    setEscalateForm({ reason: 'talk_to_human', note: '', phone: '', conversation_summary: (conversation_summary || '').trim() });
    setEscalateModal({ open: true, ticketId });
  };

  const submitEscalate = async () => {
    const ticketId = escalateModal?.ticketId;
    if (!ticketId) return;
    setEscalateLoading(ticketId);
    try {
      const res = await api.tickets.escalate(ticketId, {
        reason: (escalateForm.reason || '').trim() || 'talk_to_human',
        note: (escalateForm.note || '').trim(),
        phone: (escalateForm.phone || '').trim(),
        conversation_summary: (escalateForm.conversation_summary || '').trim(),
      });
      const eta = res?.eta;
      const patch = {
        status: 'escalated',
        escalation_priority: eta?.priority,
        sla_due_at: eta?.sla_due_at,
      };
      setActiveTickets((prev) =>
        prev.map((t) => ((t.ticket_id ?? t.id) === ticketId ? { ...t, ...patch } : t))
      );
      if (detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId) {
        setDetailTicket((prev) => (prev ? { ...prev, ...patch } : null));
      }
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
      setEscalateModal({ open: false, ticketId: null });
      const etaText = eta?.eta_text
        ? `Request sent (${(eta.priority || 'medium').toUpperCase()} priority). Expect a response ${eta.eta_text}.`
        : 'Request sent. A support specialist will review this ticket soon.';
      showToast(etaText, 'info');
    } catch (err) {
      console.error('Error escalating:', err);
    } finally {
      setEscalateLoading(null);
    }
  };

  const handleAddComment = async () => {
    if (!detailTicket || !commentText.trim()) return;
    const id = detailTicket.ticket_id ?? detailTicket.id;
    const text = commentText.trim();
    setCommentLoading(true);
    const user = TokenService.getUser();
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: text,
      author: user?.name || user?.email || user?.username || 'You',
      created_at: new Date().toISOString()
    };
    setDetailTicket((prev) => (prev && (prev.ticket_id ?? prev.id) === id
      ? { ...prev, comments: [...(prev.comments || []), optimisticComment] }
      : prev));
    setCommentText('');
    try {
      await api.tickets.addComment(id, text);
      loadTicketDetail(id, { silent: true });
    } catch (err) {
      console.error('Error adding comment:', err);
      setDetailTicket((prev) => (prev && (prev.ticket_id ?? prev.id) === id
        ? { ...prev, comments: (prev.comments || []).filter((c) => c.id !== optimisticComment.id) }
        : prev));
      setCommentText(text);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (commentText.trim() && !commentLoading) {
        handleAddComment();
      }
    }
  };

  const openEdit = (ticket) => {
    setDetailTicket(ticket);
    setEditTicket(ticket);
    setEditForm({
      issue_type: ticket.issue_type || '',
      description: ticket.description || '',
      category: ticket.category || 'other',
      status: ticket.status || 'new',
    });
    setDetailEditing(true);
  };

  const closeEdit = () => {
    setEditTicket(null);
    setEditForm({ issue_type: '', description: '', category: '', status: 'new' });
    setDetailEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTicket) return;
    const id = editTicket.ticket_id ?? editTicket.id;
    setSaveEditLoading(true);
    try {
      await api.tickets.update(id, {
        issue_type: editForm.issue_type,
        description: editForm.description,
        category: editForm.category,
        status: editForm.status,
      });
      setActiveTickets((prev) =>
        prev.map((t) =>
          (t.ticket_id ?? t.id) === id ? { ...t, ...editForm } : t
        )
      );
      setDetailTicket((prev) => (prev && (prev.ticket_id ?? prev.id) === id ? { ...prev, ...editForm } : prev));
      closeEdit();
    } catch (err) {
      console.error('Error updating ticket:', err);
    } finally {
      setSaveEditLoading(false);
    }
  };

  const handleDelete = async (ticketId) => {
    setDeleteLoading(ticketId);
    try {
      await api.tickets.delete(ticketId);
      setActiveTickets((prev) => prev.filter((t) => (t.ticket_id ?? t.id) !== ticketId));
      if (detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId) {
        setDetailTicket(null);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting ticket:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateAgentQuotaNotice(null);
    try {
      const user = TokenService.getUser();
      const payload = {
        user: user?.id ?? user?.user_id,
        issue_type: createForm.issue_type,
        description: createForm.description || createForm.issue_type,
        category: createForm.category,
        status: 'new',
      };
      if (createForm.urgency) payload.urgency = createForm.urgency;
      const maxBytes = 5 * 1024 * 1024;
      if (createScreenshotFile && createScreenshotFile.size > maxBytes) {
        showToast('Screenshot must be 5 MB or smaller.', 'error');
        setCreateLoading(false);
        return;
      }
      const newTicket = await api.tickets.create(payload, {
        screenshotFile: createScreenshotFile || undefined,
      });
      const ticketId = newTicket.id || newTicket.ticket_id;
      setCreateForm({ issue_type: '', description: '', category: 'other', urgency: '' });
      setCreateScreenshotFile(null);
      setScreenshotPreviewUrl(null);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
      setShowCreateForm(false);
      setCurrentTicket(newTicket);
      setShowAIAgent(true);
      setDetailTicket(null);
      loadTickets(true);
      window.dispatchEvent(new CustomEvent('resolvemeq:refresh-notifications'));
      try {
        await api.agent.processTicket(ticketId, { force: true });
      } catch (procErr) {
        if (procErr instanceof AgentQuotaExceededError || isAgentQuotaError(procErr)) {
          setCreateAgentQuotaNotice(
            procErr.detail ||
              procErr.message ||
              'Your monthly AI agent limit has been reached. Upgrade to continue using AI analysis.'
          );
        } else {
          console.error('Agent process after create:', procErr);
        }
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      showToast(err?.message || 'Could not create ticket.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const openAIChatForTicket = (ticket) => {
    setCurrentTicket(ticket);
    setShowAIAgent(true);
    // Close ticket detail panel when AI chat opens to avoid overlap
    setDetailTicket(null);
    setDetailEditing(false);
  };

  const formatTicketTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved') return <Badge variant="success">Resolved</Badge>;
    if (s === 'escalated') return <Badge variant="warning">In review</Badge>;
    if (s === 'in-progress' || s === 'in_progress') return <Badge variant="info">In Progress</Badge>;
    if (s === 'new' || s === 'open') return <Badge variant="warning">Open</Badge>;
    if (s === 'pending_clarification') return <Badge variant="warning">Needs info</Badge>;
    if (s === 'pending') return <Badge variant="warning">Pending</Badge>;
    // Format unknown statuses: snake_case → Title Case
    const friendly = (status || '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return <Badge variant="default">{friendly}</Badge>;
  };

  const filteredTickets = activeTickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const title = (t.issue_type || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return !q || title.includes(q) || cat.includes(q) || desc.includes(q);
  });

  if (loading) {
    return <TicketsPageSkeleton />;
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 left-1/2 z-[60] max-w-md w-[calc(100%-2rem)] -translate-x-1/2 rounded-lg px-4 py-3 text-sm shadow-lg border',
            toast.type === 'error' &&
              'bg-red-50 dark:bg-red-950/90 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
            toast.type === 'info' &&
              'bg-blue-50 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
            (toast.type === 'success' || !toast.type) &&
              'bg-green-50 dark:bg-green-950/90 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800'
          )}
          role="status"
        >
          {toast.message}
        </div>
      )}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Tickets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your active team&apos;s queue plus your personal tickets — search also surfaces similar resolved examples.
          </p>
        </div>
        <Button
          data-tour="new-ticket"
          onClick={() => {
            setCreateAgentQuotaNotice(null);
            setShowCreateForm(true);
          }}
          variant="primary"
          size="md"
          className="font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Ticket
        </Button>
      </header>

      {createAgentQuotaNotice && (
        <div
          className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-4 text-sm text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row gap-4 items-center sm:items-start"
          role="status"
        >
          <IllustrationQuota className="max-w-[96px] shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-semibold text-amber-950 dark:text-amber-50">Can&apos;t start AI on this ticket yet</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">{createAgentQuotaNotice}</p>
            <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/80">
              Upgrade your plan or wait until your next billing period to run more AI agent operations.
            </p>
            <Link to="/billing" className="inline-block mt-3 font-semibold underline underline-offset-2">
              Billing &amp; plans
            </Link>
          </div>
        </div>
      )}

      {/* Create Ticket Modal - structured form, then AI chat opens */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
              onClick={closeCreateForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Ticket</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">We'll open the AI assistant to help you right after</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateForm}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <input
                      type="text"
                      value={createForm.issue_type}
                      onChange={(e) => setCreateForm((p) => ({ ...p, issue_type: e.target.value }))}
                      placeholder="Brief description of the issue"
                      className="input-enterprise"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Additional details"
                      className="input-enterprise"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                      className="input-enterprise"
                    >
                      {categoryOptionsForSelect(ticketCategories, createForm.category).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Urgency</label>
                    <select
                      value={createForm.urgency}
                      onChange={(e) => setCreateForm((p) => ({ ...p, urgency: e.target.value }))}
                      className="input-enterprise"
                    >
                      {URGENCY_CREATE_OPTIONS.map((o) => (
                        <option key={o.value || 'none'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCreateDropActive(false);
                      const f = Array.from(e.dataTransfer?.files || []).find((x) =>
                        (x.type || '').startsWith('image/')
                      );
                      if (f) setCreateScreenshotFile(f);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setCreateDropActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      if (!e.currentTarget.contains(e.relatedTarget)) setCreateDropActive(false);
                    }}
                    className={cn(
                      'rounded-xl border-2 border-dashed p-3 transition-colors',
                      createDropActive
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/25'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Screenshot (optional)
                    </label>
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => setCreateScreenshotFile(e.target.files?.[0] ?? null)}
                      className="input-enterprise text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:bg-primary-950"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Drag and drop an image here, or choose a file — JPEG, PNG, GIF, or WebP, up to 5 MB
                    </p>
                    {screenshotPreviewUrl && (
                      <div className="mt-3 flex items-start gap-3">
                        <img
                          src={screenshotPreviewUrl}
                          alt="Screenshot preview"
                          className="max-h-36 max-w-full rounded-lg border border-gray-200 dark:border-gray-600 object-contain"
                        />
                        <button
                          type="button"
                          onClick={clearCreateScreenshot}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="primary" size="md" loading={createLoading} className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      {createLoading ? 'Creating & starting AI…' : 'Create & get AI help'}
                    </Button>
                    <Button type="button" variant="ghost" size="md" onClick={closeCreateForm} disabled={createLoading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Chat Panel - New Real Backend Integration */}
      <AnimatePresence>
        {showAIAgent && currentTicket && (
          <AIChatPanel
            ticket={currentTicket}
            isOpen={showAIAgent}
            onClose={() => setShowAIAgent(false)}
            onBackToTicket={() => {
              setShowAIAgent(false);
              setDetailTicket(currentTicket);
              loadTicketDetail(currentTicket?.ticket_id ?? currentTicket?.id, { silent: true });
            }}
            onTicketUpdate={(updated) => {
              if (!updated) return;
              const id = updated.ticket_id ?? updated.id;
              setActiveTickets((prev) =>
                prev.map((t) => ((t.ticket_id ?? t.id) === id ? { ...t, ...updated } : t))
              );
              if (currentTicket && (currentTicket?.ticket_id ?? currentTicket?.id) === id) {
                setCurrentTicket((prev) => (prev ? { ...prev, ...updated } : null));
              }
              if (detailTicket && (detailTicket?.ticket_id ?? detailTicket?.id) === id) {
                setDetailTicket((prev) => (prev ? { ...prev, ...updated } : null));
              }
            }}
            onActionComplete={() => {
              loadTickets(true);
              if (detailTicket && (detailTicket?.ticket_id ?? detailTicket?.id) === (currentTicket?.ticket_id ?? currentTicket?.id)) {
                loadTicketDetail(detailTicket?.ticket_id ?? detailTicket?.id, { silent: true });
              }
            }}
            onAppToast={showToast}
            onRequestHumanHelp={(ticketId, payload = {}) => openEscalate(ticketId, payload)}
            onFocusComments={async () => {
              const t = currentTicket;
              if (!t) return;
              const id = Number(t.ticket_id ?? t.id);
              setShowAIAgent(false);
              setDetailTicket({ ...t });
              pendingScrollToCommentsRef.current = id;
              try {
                await loadTicketDetail(id, { silent: true });
              } finally {
                scrollTicketCommentsIntoView(380);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* All tickets table */}
      <Card className="overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Tickets</h2>
          <div className="relative w-full sm:w-auto sm:min-w-[12rem]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {(communityLoading || communityHints.length > 0) && (
          <div className="px-4 sm:px-6 py-3 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              <Lightbulb className="w-4 h-4 shrink-0" />
              Similar resolved (from others)
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 mb-2">
              Same search as the header bar — examples only; open Knowledge base for more.
            </p>
            {communityLoading && communityHints.length === 0 ? (
              <ul className="space-y-2">
                {[0, 1].map((k) => (
                  <li
                    key={k}
                    className="rounded-md border border-amber-100 dark:border-amber-900/40 bg-white/60 dark:bg-gray-900/40 px-2.5 py-2 space-y-2"
                  >
                    <Skeleton className="h-3.5 w-[72%] max-w-sm" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {communityHints.slice(0, 4).map((h) => (
                  <li
                    key={`hint-${h.ticket_id}`}
                    className="text-xs rounded-md border border-amber-100 dark:border-amber-900/40 bg-white/60 dark:bg-gray-900/40 px-2.5 py-2"
                  >
                    <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                      {h.issue_type || h.description_preview || 'Resolved example'}
                    </p>
                    {h.solution_preview && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{h.solution_preview}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {searchQuery.trim().length >= 2 && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/knowledge-base?q=${encodeURIComponent(searchQuery.trim())}`)
                }
                className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open knowledge base with this search
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 sm:px-6 py-10 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center text-center gap-3">
            <IllustrationTicketsError className="max-w-[140px]" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">We couldn&apos;t load your tickets</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 max-w-md mx-auto">{error}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Check your connection and try refreshing the page.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => loadTickets(false)}>
              Try again
            </Button>
          </div>
        )}

        {filteredTickets.length === 0 ? (
          <div className="px-4 sm:px-6 py-14 text-center flex flex-col items-center">
            <IllustrationTicketsEmpty className="max-w-[200px] mb-4 opacity-90" />
            {activeTickets.length === 0 ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">No tickets yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm">
                  When something breaks or you need help, open a ticket — our AI assistant will walk through fixes with you.
                </p>
                <Button onClick={() => setShowCreateForm(true)} variant="primary" size="md" className="mt-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first ticket
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">No matches</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm">
                  Nothing in your list matches that search. Try another keyword or clear the search box.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
              {filteredTickets.map((ticket) => {
                const id = ticket.ticket_id ?? ticket.id;
                const title = ticket.issue_type || 'No title';
                const isSelected = detailTicket !== null && (detailTicket?.ticket_id ?? detailTicket?.id) === id;
                return (
                  <div
                    key={id}
                    className={cn(
                      'p-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/10'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleViewDetail(ticket)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            #{id} · {ticket.category || '—'} · {formatTicketTime(ticket.created_at)}
                          </p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openAIChatForTicket(ticket); }}
                        className="text-sm text-primary-600 dark:text-primary-400 font-medium inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Chat
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleViewDetail(ticket); }}
                        className="text-sm text-gray-600 dark:text-gray-400 font-medium"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(id); }}
                        className="text-sm text-gray-600 dark:text-gray-400 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Issue</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {filteredTickets.map((ticket) => {
                    const id = ticket.ticket_id ?? ticket.id;
                    const title = ticket.issue_type || 'No title';
                    const isSelected = detailTicket !== null && (detailTicket?.ticket_id ?? detailTicket?.id) === id;
                    return (
                      <tr
                        key={id}
                        className={cn(
                          'hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors duration-150',
                          isSelected && 'bg-primary-50 dark:bg-primary-900/10'
                        )}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-500">#{id}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(ticket)}
                            className="text-left font-medium text-sm text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 max-w-[280px] truncate block"
                          >
                            {title}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{ticket.category || '—'}</td>
                        <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatTicketTime(ticket.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => openAIChatForTicket(ticket)}
                              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
                              title="Chat with AI"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              AI Chat
                            </button>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <button
                              type="button"
                              onClick={() => handleViewDetail(ticket)}
                              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                            >
                              View
                            </button>
                            <span className="text-gray-300 dark:text-gray-700">·</span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(id)}
                              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Ticket</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete ticket #{deleteConfirm}? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={() => handleDelete(deleteConfirm)}
                    loading={deleteLoading === deleteConfirm}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleteLoading !== null}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Ticket detail panel - portaled to body for full viewport height */}
      {detailTicket !== null && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
            onClick={() => { setDetailTicket(null); closeEdit(); }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            style={{ top: 0, right: 0, bottom: 0, height: '100dvh', maxHeight: '100dvh' }}
            className="fixed w-full sm:max-w-2xl bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
              <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ticket #{detailTicket?.ticket_id ?? detailTicket?.id ?? '—'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                    {detailTicket?.issue_type || 'No title'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDetailTicket(null); closeEdit(); }}
                  className="flex-shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {detailEditing ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                      <input
                        type="text"
                        value={editForm.issue_type}
                        onChange={(e) => setEditForm((p) => ({ ...p, issue_type: e.target.value }))}
                        className="input-enterprise"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        className="input-enterprise"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                        className="input-enterprise"
                      >
                        {categoryOptionsForSelect(ticketCategories, editForm.category).map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                        className="input-enterprise"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" variant="primary" size="md" loading={saveEditLoading} className="flex-1">Save Changes</Button>
                      <Button type="button" variant="ghost" size="md" onClick={() => { setDetailEditing(false); setEditTicket(null); }} disabled={saveEditLoading}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {detailLoading ? (
                      <TicketDetailPanelSkeleton />
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
                            {getStatusBadge(detailTicket?.status)}
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Category</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{detailTicket?.category || '—'}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Created</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{formatTicketTime(detailTicket?.created_at)}</p>
                          </div>
                        </div>

                        {(() => {
                          const next = getTicketNextStep(detailTicket);
                          if (!next) return null;
                          const toneBar =
                            next.tone === 'success'
                              ? 'border-green-200 bg-green-50/90 dark:bg-green-950/25 dark:border-green-900/50'
                              : next.tone === 'warning'
                                ? 'border-amber-200 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-900/50'
                                : 'border-primary-200 bg-primary-50/80 dark:bg-primary-950/20 dark:border-primary-900/40';
                          return (
                            <div
                              className={cn(
                                'rounded-lg border px-4 py-3 text-sm',
                                toneBar
                              )}
                              role="status"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">
                                {next.title}
                              </p>
                              <p className="text-gray-800 dark:text-gray-200 leading-snug">{next.body}</p>
                            </div>
                          );
                        })()}

                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
                          <Button variant="ghost" size="sm" onClick={() => { setEditTicket(detailTicket); setEditForm({ issue_type: detailTicket?.issue_type || '', description: detailTicket?.description || '', category: detailTicket?.category || 'other', status: detailTicket?.status || 'new' }); setDetailEditing(true); }}>
                            Edit
                          </Button>
                          <select
                            value={detailTicket?.status || 'new'}
                            onChange={(e) => handleUpdateStatus(detailTicket?.ticket_id ?? detailTicket?.id, e.target.value)}
                            disabled={updatingStatus !== null}
                            className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {(detailTicket?.status !== 'escalated' && detailTicket?.status !== 'resolved') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEscalate(detailTicket?.ticket_id ?? detailTicket?.id)}
                              loading={escalateLoading === (detailTicket?.ticket_id ?? detailTicket?.id)}
                            >
                              Request human help
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openAIChatForTicket(detailTicket)}>
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            AI Chat
                          </Button>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailTicket?.description || '—'}</p>
                          </div>
                        </div>

                        {detailTicket?.screenshot ? (
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Screenshot
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setScreenshotLightboxUrl(resolveTicketMediaUrl(detailTicket.screenshot))
                              }
                              className="block w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <img
                                src={resolveTicketMediaUrl(detailTicket.screenshot)}
                                alt="Ticket screenshot"
                                className="w-full max-h-56 object-contain bg-gray-100 dark:bg-gray-900"
                                loading="lazy"
                              />
                              <span className="block px-3 py-2 text-xs text-primary-600 dark:text-primary-400">
                                Click to enlarge
                              </span>
                            </button>
                          </div>
                        ) : null}

                        {detailTicket?.status === 'resolved' && (
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-sm text-green-800 dark:text-green-200">
                            This issue is marked as resolved. Need something else? Use <strong>AI Chat</strong> above or create a new ticket.
                          </div>
                        )}

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <AgentInsights
                            ticketId={detailTicket?.ticket_id ?? detailTicket?.id}
                            onEscalate={() => openEscalate(detailTicket?.ticket_id ?? detailTicket?.id)}
                            onActionComplete={() => loadTicketDetail(detailTicket?.ticket_id ?? detailTicket?.id, { silent: true })}
                            onOpenTicket={(id) => loadTicketDetail(id)}
                          />
                        </div>

                        <div id="ticket-comments-section" className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Comments {(detailTicket?.comments?.length ?? 0) ? `(${detailTicket.comments.length})` : ''}
                            </p>
                            {detailTicket?.conversation_state_label && (
                              <span
                                className={cn(
                                  "text-[11px] px-2 py-1 rounded-full border",
                                  detailTicket.awaiting_response_from === 'support'
                                    ? "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                                    : detailTicket.awaiting_response_from === 'user'
                                      ? "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                                      : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                                )}
                              >
                                {detailTicket.conversation_state_label}
                              </span>
                            )}
                          </div>
                          {(detailTicket?.comments?.length ?? 0) > 0 && (
                            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                              {(detailTicket.comments || []).map((c) => (
                                <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.author ?? 'User'}</span>
                                      {c.author_role && (
                                        <span className={cn(
                                          "text-[10px] px-1.5 py-0.5 rounded border",
                                          c.author_role === 'requester'
                                            ? "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                                            : "border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300"
                                        )}>
                                          {c.author_role === 'requester' ? 'Requester' : 'Support'}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.created_at ? formatTicketTime(c.created_at) : ''}</span>
                                  </div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{c.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-end">
                            <textarea
                              ref={commentInputRef}
                              rows={1}
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={handleCommentKeyDown}
                              placeholder="Type a comment..."
                              className="flex-1 min-h-[40px] max-h-[160px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none overflow-y-auto"
                            />
                            <Button variant="primary" size="sm" onClick={handleAddComment} disabled={!commentText.trim()} loading={commentLoading}>
                              Send
                            </Button>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <ActionHistory ticketId={detailTicket?.ticket_id ?? detailTicket?.id} />
                        </div>

                        <div id="resolution-feedback-section" className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <ResolutionFeedback
                            ticketId={detailTicket?.ticket_id ?? detailTicket?.id}
                            onFeedbackSubmitted={() => setDetailTicket((prev) => (prev ? { ...prev, resolution_feedback_submitted: true } : null))}
                            feedbackAlreadySubmitted={!!detailTicket?.resolution_feedback_submitted}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {escalateModal?.open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Request human help">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              aria-label="Close"
              onClick={() => !escalateLoading && setEscalateModal({ open: false, ticketId: null })}
            />
            <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request human help</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    We’ll notify the support team and keep this ticket in review. You can continue adding comments while you wait.
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => !escalateLoading && setEscalateModal({ open: false, ticketId: null })}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    What do you need help with?
                  </label>
                  <select
                    value={escalateForm.reason}
                    onChange={(e) => setEscalateForm((p) => ({ ...p, reason: e.target.value }))}
                    className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="talk_to_human">Talk to a support specialist</option>
                    <option value="urgent_blocked">I’m blocked (urgent)</option>
                    <option value="billing_account">Billing / account issue</option>
                    <option value="security_access">Security / access issue</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Phone number (optional)
                  </label>
                  <input
                    type="tel"
                    value={escalateForm.phone}
                    onChange={(e) => setEscalateForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +1 555 012 3456"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    maxLength={40}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Share this only if you’d like a call back.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Add a short note (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={escalateForm.note}
                    onChange={(e) => setEscalateForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder="What have you tried? What’s the impact?"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    maxLength={2000}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" disabled={escalateLoading} onClick={() => setEscalateModal({ open: false, ticketId: null })}>
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" size="sm" loading={escalateLoading} disabled={escalateLoading} onClick={submitEscalate}>
                    Send request
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {screenshotLightboxUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setScreenshotLightboxUrl(null)}
            role="presentation"
          >
            <button
              type="button"
              onClick={() => setScreenshotLightboxUrl(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-white/90 hover:bg-white/10 z-[101]"
              aria-label="Close"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={screenshotLightboxUrl}
              alt="Screenshot full size"
              className="max-h-[92vh] max-w-full object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tickets;
