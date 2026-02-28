import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Zap,
  Send,
  X,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AgentInsights from '../components/AgentInsights';
import ActionHistory from '../components/ActionHistory';
import ResolutionFeedback from '../components/ResolutionFeedback';
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
  const [currentTicket, setCurrentTicket] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
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
    setShowAIAgent(true);
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      message: issue
        ? `I see you're having trouble with "${issue}". I'll create a ticket and help you step by step.`
        : `Hi! I'm your AI assistant for ResolveMeQ. What can I help you with today?`,
      timestamp: new Date().toISOString(),
      suggestions: issue ? [] : ['Hardware problems', 'Software issues', 'Network connectivity', 'Account access'],
    };
    setAiMessages([welcomeMessage]);

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
        setTimeout(() => {
          setAiMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: 'ai',
              message: `Ticket #${newTicket.ticket_id ?? newTicket.id} created. I'll help you resolve this.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }, 800);
        loadTickets();
      } catch (err) {
        console.error('Error creating ticket:', err);
      }
    }
  };

  const openAIChatForTicket = (ticket) => {
    setCurrentTicket(ticket);
    setShowAIAgent(true);
    setAiMessages([
      {
        id: Date.now(),
        type: 'ai',
        message: `You're viewing ticket #${ticket.ticket_id ?? ticket.id}: "${ticket.issue_type || 'No title'}". How can I help?`,
        timestamp: new Date().toISOString(),
      },
    ]);
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

  const sendMessageToAI = async (textOrChoice) => {
    const messageText = typeof textOrChoice === 'string' ? textOrChoice : (textOrChoice?.value ?? textOrChoice?.label ?? '');
    if (!messageText.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      message: messageText,
      timestamp: new Date().toISOString(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    setUserMessage('');
    setIsAiTyping(true);

    try {
      if (!currentTicket) {
        const user = TokenService.getUser();
        const ticketData = {
          user: user?.id ?? user?.user_id,
          issue_type: messageText.substring(0, 100),
          description: messageText,
          category: determineCategory(messageText),
          status: 'new',
        };
        const newTicket = await api.tickets.create(ticketData);
        setCurrentTicket(newTicket);
        loadTickets();
      }
      setTimeout(() => {
        const aiResponse = generateAIResponse(messageText);
        setAiMessages((prev) => [...prev, aiResponse]);
        setIsAiTyping(false);
      }, 1500);
    } catch (err) {
      console.error('Error sending message:', err);
      setIsAiTyping(false);
    }
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    let message = "I'm looking into that. Try a quick restart and check for updates.";
    let suggestions = [];
    let choices = [];

    if (input.includes('printer') || input.includes('printing')) {
      message = "To suggest the right steps I need one detail: Is the printer connected over the network or via USB?";
      choices = [
        { label: 'Network printer', value: 'network printer' },
        { label: 'USB printer', value: 'usb printer' },
        { label: 'Not sure', value: 'not sure printer' },
      ];
    } else if (input.includes('network') && (input.includes('printer') || input.includes('usb'))) {
      message = "I can create a ticket and assign it to the hardware team, or I can show you self-service steps to try first. Which do you prefer?";
      choices = [
        { label: 'Create ticket & assign', value: 'create ticket assign hardware' },
        { label: 'Show self-service steps', value: 'show self-service steps' },
      ];
    } else if (input.includes('computer') || input.includes('laptop') || input.includes("won't start")) {
      message = "For computer issues I'll need: Does it power on at all (lights, fan), or nothing happens when you press the button?";
      choices = [
        { label: 'Powers on but no display', value: 'powers on no display' },
        { label: 'Nothing happens at all', value: 'nothing happens' },
        { label: 'It starts then stops / restarts', value: 'starts then stops' },
      ];
    } else if (input.includes('internet') || input.includes('wifi') || input.includes('connection')) {
      message = "For connectivity I can: create a ticket for the network team, or walk you through quick checks (router restart, other devices). Which do you want?";
      choices = [
        { label: 'Create ticket for network team', value: 'create ticket network' },
        { label: 'Walk me through quick checks', value: 'walk through quick checks' },
      ];
    } else if (input.includes('software') || input.includes('app') || input.includes('program')) {
      message = "Is the problem that the app won't open, it's slow, or you get an error message?";
      choices = [
        { label: "Won't open", value: 'software wont open' },
        { label: 'Slow or freezing', value: 'software slow' },
        { label: 'Error message', value: 'software error' },
      ];
    } else if (
      input.includes('create ticket') || input.includes('assign') ||
      input.includes('self-service') || input.includes('quick checks') ||
      input.includes('powers on') || input.includes('nothing happens') || input.includes('starts then')
    ) {
      message = "I've created your ticket and added your answers. I recommend trying the steps in the Knowledge Base first—I can open the relevant article for you.";
      choices = [
        { label: 'Open suggested article', value: 'open suggested article' },
        { label: 'Just show my ticket', value: 'show my ticket' },
      ];
    } else {
      message = "I'm looking into that. To give you the best next step: is this about hardware, software, network, or account access?";
      suggestions = ['Hardware', 'Software', 'Network', 'Account access'];
    }

    return {
      id: Date.now(),
      type: 'ai',
      message,
      timestamp: new Date().toISOString(),
      suggestions: suggestions.length ? suggestions : undefined,
      choices: choices.length ? choices : undefined,
    };
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage and resolve support tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => startAIAgent()} variant="ghost" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button onClick={() => setShowCreateForm(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </header>

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

      {/* AI Chat panel */}
      <AnimatePresence>
        {showAIAgent && (
          <Card className="overflow-hidden">
            <div className="bg-primary-600 dark:bg-primary-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-white">AI Support Agent</h3>
                  <p className="text-primary-100 text-xs mt-0.5">Guided troubleshooting and resolution</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIAgent(false)}
                className="p-1.5 rounded-md text-white/80 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {aiMessages.map((msg) => {
                const isLastAi = msg.type === 'ai' && msg.id === aiMessages.filter((m) => m.type === 'ai').pop()?.id;
                const showPrompts = isLastAi && !isAiTyping && (msg.suggestions?.length || msg.choices?.length);
                return (
                  <div key={msg.id} className="space-y-2">
                    <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-lg px-4 py-2.5 text-sm ${
                          msg.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                    {showPrompts && (
                      <div className="flex justify-start pl-1">
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {msg.choices?.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => sendMessageToAI(c)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-150"
                            >
                              {c.label}
                            </button>
                          ))}
                          {msg.suggestions?.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => sendMessageToAI(s)}
                              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex gap-2 bg-white dark:bg-gray-950">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessageToAI(userMessage)}
                placeholder="Describe your issue..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <Button onClick={() => sendMessageToAI(userMessage)} disabled={!userMessage.trim()} variant="primary" loading={isAiTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
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
                            <Zap className="w-4 h-4 mr-1.5" />
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
