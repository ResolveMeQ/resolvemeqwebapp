import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Zap,
  Sparkles,
  X,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AgentInsights from '../components/AgentInsights';
import ActionHistory from '../components/ActionHistory';
import ResolutionFeedback from '../components/ResolutionFeedback';
import SimpleTicketCreation from '../components/SimpleTicketCreation';
import AIChatPanel from '../components/AIChatPanel';
import { api, TokenService } from '../services/api';
import { cn } from '../utils/cn';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'pending_clarification', label: 'Pending clarification' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
];

const Tickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTickets, setActiveTickets] = useState([]);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showSimpleCreation, setShowSimpleCreation] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ issue_type: '', description: '', category: 'other' });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const openId = location.state?.openTicketId;
    if (!openId || activeTickets.length === 0) return;
    const ticket = activeTickets.find((t) => (t.ticket_id ?? t.id) === openId);
    if (ticket) {
      setDetailTicket(ticket);
      loadTicketDetail(openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openTicketId, activeTickets, location.pathname, navigate]);

  useEffect(() => {
    if (location.state?.openCreateForm) {
      setShowCreateForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreateForm, location.pathname, navigate]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const tickets = await api.tickets.list({ limit: 100 });
      setActiveTickets(Array.isArray(tickets) ? tickets : []);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err.message || 'Failed to load tickets');
      setActiveTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    if (!ticketId) return;
    setDetailLoading(true);
    try {
      const t = await api.tickets.get(ticketId);
      setDetailTicket(t);
    } catch (err) {
      console.error('Error loading ticket:', err);
      setDetailTicket(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (ticket) => {
    const id = ticket.ticket_id ?? ticket.id;
    setDetailTicket(ticket);
    loadTicketDetail(id);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setUpdatingStatus(ticketId);
    try {
      await api.tickets.updateStatus(ticketId, newStatus);
      setActiveTickets((prev) =>
        prev.map((t) =>
          (t.ticket_id ?? t.id) === ticketId ? { ...t, status: newStatus } : t
        )
      );
      if (detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId) {
        setDetailTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEscalate = async (ticketId) => {
    setEscalateLoading(ticketId);
    try {
      await api.tickets.escalate(ticketId);
      setActiveTickets((prev) =>
        prev.map((t) =>
          (t.ticket_id ?? t.id) === ticketId ? { ...t, status: 'escalated' } : t
        )
      );
      if (detailTicket && (detailTicket.ticket_id ?? detailTicket.id) === ticketId) {
        setDetailTicket((prev) => (prev ? { ...prev, status: 'escalated' } : null));
      }
    } catch (err) {
      console.error('Error escalating:', err);
    } finally {
      setEscalateLoading(null);
    }
  };

  const handleAddComment = async () => {
    if (!detailTicket || !commentText.trim()) return;
    const id = detailTicket.ticket_id ?? detailTicket.id;
    setCommentLoading(true);
    try {
      await api.tickets.addComment(id, commentText.trim());
      setCommentText('');
      loadTicketDetail(id);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
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
    try {
      const user = TokenService.getUser();
      await api.tickets.create({
        user: user?.id ?? user?.user_id,
        issue_type: createForm.issue_type,
        description: createForm.description || createForm.issue_type,
        category: createForm.category,
        status: 'new',
      });
      setCreateForm({ issue_type: '', description: '', category: 'other' });
      setShowCreateForm(false);
      loadTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const startAIAgent = async (issue = null) => {
    // If issue provided, create a ticket first
    if (issue) {
      try {
        const user = TokenService.getUser();
        const ticketData = {
          user: user?.id ?? user?.user_id,
          issue_type: issue,
          description: issue,
          category: determineCategory(issue),
          status: 'new',
        };
        const newTicket = await api.tickets.create(ticketData);
        setCurrentTicket(newTicket);
        setShowAIAgent(true);
        loadTickets();
      } catch (err) {
        console.error('Error creating ticket:', err);
      }
    } else {
      // Just open chat without a specific ticket (general help)
      setShowAIAgent(true);
    }
  };

  const openAIChatForTicket = (ticket) => {
    setCurrentTicket(ticket);
    setShowAIAgent(true);
    // Close ticket detail panel when AI chat opens to avoid overlap
    setDetailTicket(null);
    setDetailEditing(false);
  };

  const determineCategory = (issue) => {
    const issueLower = (issue || '').toLowerCase();
    if (issueLower.includes('wifi') || issueLower.includes('internet') || issueLower.includes('connection')) return 'network';
    if (issueLower.includes('computer') || issueLower.includes('laptop') || issueLower.includes('start')) return 'hardware';
    if (issueLower.includes('software') || issueLower.includes('app') || issueLower.includes('program')) return 'software';
    if (issueLower.includes('phone') || issueLower.includes('mobile')) return 'mobile';
    if (issueLower.includes('printer')) return 'hardware';
    return 'other';
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
    if (s === 'escalated') return <Badge variant="error">Escalated</Badge>;
    if (s === 'in-progress' || s === 'in_progress') return <Badge variant="info">In Progress</Badge>;
    if (s === 'new' || s === 'open') return <Badge variant="warning">Open</Badge>;
    return <Badge variant="default">{status || '—'}</Badge>;
  };

  const filteredTickets = activeTickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const title = (t.issue_type || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return !q || title.includes(q) || cat.includes(q) || desc.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Tickets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get instant AI help or manage existing tickets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* PRIMARY BUTTON - AI Help (Simple Flow) */}
          <Button onClick={() => setShowSimpleCreation(true)} variant="primary" size="md" className="font-semibold">
            <Sparkles className="w-5 h-5 mr-2" />
            Get AI Help
          </Button>
          {/* Secondary - Manual ticket */}
          <Button onClick={() => setShowCreateForm(true)} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Manual Ticket
          </Button>
        </div>
      </header>

      {/* Simple AI-First Ticket Creation */}
      <AnimatePresence>
        {showSimpleCreation && (
          <SimpleTicketCreation
            onTicketCreated={(ticket) => {
              loadTickets();
              // Keep modal open for conversation
            }}
            onClose={() => {
              setShowSimpleCreation(false);
              loadTickets();
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
              onClick={() => setShowCreateForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card className="w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Ticket</h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
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
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="network">Network</option>
                      <option value="access">Access</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="primary" size="md" loading={createLoading} className="flex-1">
                      Create Ticket
                    </Button>
                    <Button type="button" variant="ghost" size="md" onClick={() => setShowCreateForm(false)} disabled={createLoading}>
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
            onActionComplete={() => {
              loadTickets();
              if (detailTicket && (detailTicket?.ticket_id ?? detailTicket?.id) === (currentTicket?.ticket_id ?? currentTicket?.id)) {
                loadTicketDetail(detailTicket?.ticket_id ?? detailTicket?.id);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* All tickets table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Tickets</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 w-56 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 text-center text-red-600 dark:text-red-400 text-sm border-b border-gray-200 dark:border-gray-800">{error}</div>
        )}

        {filteredTickets.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(ticket)}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
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

      {/* Ticket detail panel */}
      <AnimatePresence>
        {detailTicket !== null && (
          <>
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
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

              <div className="flex-1 overflow-y-auto p-6">
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
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                        <option value="network">Network</option>
                        <option value="access">Access</option>
                        <option value="other">Other</option>
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
                      <div className="py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto" />
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4">
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

                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Description</p>
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailTicket?.description || '—'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
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
                            <Button variant="outline" size="sm" onClick={() => handleEscalate(detailTicket?.ticket_id ?? detailTicket?.id)} loading={escalateLoading === (detailTicket?.ticket_id ?? detailTicket?.id)}>
                              Escalate
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openAIChatForTicket(detailTicket)}>
                            <Sparkles className="w-4 h-4 mr-1.5" />
                            AI Chat
                          </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Add Comment</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Type a comment..."
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <Button variant="primary" size="sm" onClick={handleAddComment} disabled={!commentText.trim()} loading={commentLoading}>
                              Send
                            </Button>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <AgentInsights
                            ticketId={detailTicket?.ticket_id ?? detailTicket?.id}
                            onEscalate={() => handleEscalate(detailTicket?.ticket_id ?? detailTicket?.id)}
                            onActionComplete={() => loadTicketDetail(detailTicket?.ticket_id ?? detailTicket?.id)}
                          />
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <ActionHistory ticketId={detailTicket?.ticket_id ?? detailTicket?.id} />
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                          <ResolutionFeedback
                            ticketId={detailTicket?.ticket_id ?? detailTicket?.id}
                            onFeedbackSubmitted={() => loadTicketDetail(detailTicket?.ticket_id ?? detailTicket?.id)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tickets;
