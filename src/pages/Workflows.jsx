import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, X, AlertTriangle, Settings2, Zap, Play, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const location = useLocation();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
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
      const data = await api.workflows.list({ overdue: showOverdueOnly || undefined });
      setWorkflows(data?.workflows || []);
    } catch (e) {
      setError(e?.message || 'Could not load workflows.');
    } finally {
      setLoading(false);
    }
  }, [showOverdueOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const openStartModal = async (preferredTemplateId) => {
    setShowStartModal(true);
    setStartError(null);
    try {
      const data = await api.workflows.listTemplatesManage().catch(() => api.workflows.templates());
      const list = data?.templates || [];
      setTemplates(list);
      if (preferredTemplateId != null) {
        setSelectedTemplateId(String(preferredTemplateId));
      } else if (list[0]) {
        setSelectedTemplateId(String(list[0].id));
      }
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

  useEffect(() => {
    const tid = location.state?.startTemplateId;
    if (tid == null) return;
    navigate(location.pathname, { replace: true, state: {} });
    openStartModal(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep link from templates page
  }, [location.state?.startTemplateId]);

  const ticketMatches = ticketQuery.trim()
    ? pickerTickets
        .filter((t) => {
          const id = String(t.ticket_id ?? t.id);
          const q = ticketQuery.trim().toLowerCase();
          return id === q || id.includes(q) || (t.issue_type || '').toLowerCase().includes(q);
        })
        .slice(0, 8)
    : pickerTickets.slice(0, 8); // empty query: show recent tickets to pick from immediately

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

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(selectedTemplateId)),
    [templates, selectedTemplateId]
  );

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
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/workflows/templates">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-1.5" />
              Templates
            </Button>
          </Link>
          <Link to="/settings/automation">
            <Button variant="outline" size="sm">
              <Zap className="w-4 h-4 mr-1.5" />
              Rules
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => openStartModal()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Start Workflow
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant={showOverdueOnly ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowOverdueOnly((v) => !v)}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          {showOverdueOnly ? 'Showing overdue' : 'Overdue only'}
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
                      {wf.has_overdue && (
                        <Badge variant="error" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {wf.workflow_sla_breached ? 'SLA breached' : 'Overdue'}
                        </Badge>
                      )}
                      <div className="flex-1 min-w-[160px]">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {wf.template_name || 'Workflow'}
                        </p>
                        {wf.due_at && wf.status === 'in_progress' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SLA due {new Date(wf.due_at).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
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
                        <WorkflowChecklist workflow={wf} onUpdate={load} variant="embedded" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg"
          >
            <Card className="p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary-600" />
                  Start a workflow
                </h2>
                <button type="button" onClick={() => setShowStartModal(false)} aria-label="Close">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Pick a playbook and optionally link an existing ticket.
              </p>

              {startError && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{startError}</p>}

              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Playbook
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                {templates.length === 0 && <option value="">No templates available</option>}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.step_count ?? t.steps?.length ?? 0} steps)
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {selectedTemplate.trigger_category ? (
                      <Badge variant="primary" className="gap-1 text-[10px]">
                        <Zap className="w-3 h-3" />
                        Auto on {selectedTemplate.trigger_category.replace(/_/g, ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Manual start</Badge>
                    )}
                    <span className="text-[10px] text-gray-500">
                      {selectedTemplate.step_count ?? selectedTemplate.steps?.length ?? 0} steps
                    </span>
                  </div>
                  {(selectedTemplate.steps || []).slice(0, 4).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 py-0.5">
                      <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] font-medium shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate">{step.title}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 ml-auto" aria-hidden />
                    </div>
                  ))}
                  {(selectedTemplate.steps?.length || 0) > 4 && (
                    <p className="text-[10px] text-gray-400 mt-1 pl-7">
                      +{selectedTemplate.steps.length - 4} more
                    </p>
                  )}
                </div>
              )}

              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Link ticket (optional)
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

              <div className="flex justify-between items-center gap-2">
                <Link
                  to="/workflows/templates"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={() => setShowStartModal(false)}
                >
                  Manage playbooks
                </Link>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowStartModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" loading={starting} disabled={!selectedTemplateId} onClick={handleStart}>
                    Start workflow
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Workflows;
