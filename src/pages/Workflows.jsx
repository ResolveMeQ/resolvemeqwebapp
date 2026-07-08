import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import WorkflowChecklist from '../components/WorkflowChecklist';
import { api } from '../services/api';

const STATUS_BADGE = {
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'secondary',
};

const Workflows = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [linkTicketId, setLinkTicketId] = useState('');
  const [ticketQuery, setTicketQuery] = useState('');
  const [pickerTickets, setPickerTickets] = useState([]);
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.workflows.list();
      setWorkflows(data?.workflows || []);
    } catch (e) {
      setError(e?.message || 'Could not load workflows.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openStartModal = async () => {
    setShowStartModal(true);
    setStartError(null);
    try {
      const data = await api.workflows.templates();
      setTemplates(data?.templates || []);
      if (data?.templates?.[0]) setSelectedTemplateId(String(data.templates[0].id));
    } catch (e) {
      setStartError(e?.message || 'Could not load templates.');
    }
    try {
      const tickets = await api.tickets.list({ limit: 100 });
      setPickerTickets(Array.isArray(tickets) ? tickets : []);
    } catch {
      setPickerTickets([]);
    }
  };

  const ticketMatches = ticketQuery.trim()
    ? pickerTickets
        .filter((t) => {
          const id = String(t.ticket_id ?? t.id);
          const q = ticketQuery.trim().toLowerCase();
          return id === q || id.includes(q) || (t.issue_type || '').toLowerCase().includes(q);
        })
        .slice(0, 8)
    : [];

  const handleTicketQueryChange = (value) => {
    setTicketQuery(value);
    setLinkTicketId(''); // typing again means the previous selection (if any) no longer applies
    setShowTicketDropdown(true);
  };

  const handlePickTicket = (t) => {
    const id = t.ticket_id ?? t.id;
    setLinkTicketId(String(id));
    setTicketQuery(`#${id} · ${t.issue_type || ''}`);
    setShowTicketDropdown(false);
  };

  const handleStart = async () => {
    if (!selectedTemplateId) return;
    setStarting(true);
    setStartError(null);
    try {
      // Prefer an explicit picker selection; otherwise treat the typed text as a raw ticket
      // number (keeps this usable if the team has more than 100 tickets or the list hasn't loaded).
      const ticketId = linkTicketId.trim() || ticketQuery.trim();
      await api.workflows.create({
        templateId: selectedTemplateId,
        ticketId: ticketId || undefined,
      });
      setShowStartModal(false);
      setLinkTicketId('');
      setTicketQuery('');
      load();
    } catch (e) {
      setStartError(e?.message || 'Could not start this workflow.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Workflows
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Multi-step processes for your team — provisioning, and anything else that's more than one ticket's worth of steps.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openStartModal}>
          <Plus className="w-4 h-4 mr-1.5" />
          Start Workflow
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
          {error}
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Card key={i} className="p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No workflows yet — start one, or create a ticket in a category that triggers one (e.g. Provisioning).
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {workflows.map((wf) => {
              const isExpanded = expandedId === wf.id;
              return (
                <motion.div key={wf.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="p-4">
                    <div
                      className="flex flex-wrap items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : wf.id)}
                    >
                      <Badge variant={STATUS_BADGE[wf.status] || 'secondary'}>
                        {wf.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {wf.template_name || 'Workflow'}
                        </p>
                        {wf.ticket_id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tickets/${wf.ticket_id}`);
                            }}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Ticket #{wf.ticket_id} · {wf.ticket_issue_type}
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                        {wf.steps_done}/{wf.steps_total} done
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <WorkflowChecklist workflow={wf} onUpdate={load} />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Start a workflow</h2>
              <button type="button" onClick={() => setShowStartModal(false)} aria-label="Close">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {startError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{startError}</p>}

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              {templates.length === 0 && <option value="">No templates available</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.step_count} steps)
                </option>
              ))}
            </select>

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Link an existing ticket (optional)
            </label>
            <div className="relative mb-5">
              <input
                type="text"
                value={ticketQuery}
                onChange={(e) => handleTicketQueryChange(e.target.value)}
                onFocus={() => setShowTicketDropdown(true)}
                onBlur={() => setTimeout(() => setShowTicketDropdown(false), 150)}
                placeholder="Search by ticket # or title…"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
              {showTicketDropdown && ticketMatches.length > 0 && (
                <div
                  role="listbox"
                  className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
                >
                  {ticketMatches.map((t) => (
                    <button
                      type="button"
                      key={t.ticket_id ?? t.id}
                      role="option"
                      onClick={() => handlePickTicket(t)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      #{t.ticket_id ?? t.id} · {t.issue_type || 'Untitled'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowStartModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" loading={starting} disabled={!selectedTemplateId} onClick={handleStart}>
                Start
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Workflows;
