import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, ArrowLeft, Play, Trash2, ToggleLeft, ToggleRight, Pencil, Copy } from 'lucide-react';
import Card from '../components/ui/Card';
import WorkspaceRequiredBanner from '../components/WorkspaceRequiredBanner';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';

const CUSTOM_OPTION = '__custom__';

const EMPTY_FORM = {
  name: '',
  description: '',
  trigger: 'ticket.created',
  cron_expression: '',
  condition_field: 'category',
  condition_op: 'equals',
  condition_value: '',
  action_type: 'start_workflow',
  template_trigger_category: 'onboarding',
  template_id: '',
  notify_channel_id: '',
  notify_message: '',
  assign_user_id: '',
  set_field_name: '',
  set_field_value: '',
  webhook_url: '',
  priority: 100,
};

function ruleToForm(rule) {
  const cond = rule.conditions?.[0];
  const action = rule.actions?.[0] || {};
  return {
    name: rule.name || '',
    description: rule.description || '',
    trigger: rule.trigger || 'ticket.created',
    cron_expression: rule.cron_expression || '',
    condition_field: cond?.field || 'category',
    condition_op: cond?.op || 'equals',
    condition_value: cond?.value != null ? String(cond.value) : '',
    action_type: action.type || 'start_workflow',
    template_trigger_category: action.template_trigger_category || 'onboarding',
    template_id: action.template_id ? String(action.template_id) : '',
    notify_channel_id: action.channel_id || '',
    notify_message: action.message || '',
    assign_user_id: action.user_id ? String(action.user_id) : '',
    set_field_name: action.field || '',
    set_field_value: action.value != null ? String(action.value) : '',
    webhook_url: action.url || '',
    priority: rule.priority ?? 100,
  };
}

function formToPayload(form) {
  const conditionField = form.condition_field === CUSTOM_OPTION ? '' : form.condition_field.trim();
  const conditionValue = form.condition_value === CUSTOM_OPTION ? '' : form.condition_value.trim();
  const conditions = conditionValue
    ? [{
      field: conditionField || 'category',
      op: form.condition_op || 'equals',
      value: conditionValue,
    }]
    : [];

  const action = { type: form.action_type };
  switch (form.action_type) {
    case 'start_workflow':
      if (form.template_id.trim()) {
        action.template_id = form.template_id.trim();
      } else {
        action.template_trigger_category = form.template_trigger_category.trim();
      }
      break;
    case 'notify_slack':
      if (form.notify_channel_id.trim()) action.channel_id = form.notify_channel_id.trim();
      if (form.notify_message.trim()) action.message = form.notify_message.trim();
      break;
    case 'notify_teams':
      if (form.notify_message.trim()) action.message = form.notify_message.trim();
      break;
    case 'assign_ticket':
      action.user_id = form.assign_user_id.trim();
      break;
    case 'set_field':
      action.field = form.set_field_name.trim();
      action.value = form.set_field_value;
      break;
    case 'call_webhook':
      action.url = form.webhook_url.trim();
      break;
    default:
      break;
  }

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    trigger: form.trigger,
    cron_expression: form.trigger === 'schedule.cron' ? form.cron_expression.trim() : '',
    conditions,
    actions: [action],
    priority: Number(form.priority) || 100,
  };
}

function actionSummary(rule, metadata) {
  const action = rule.actions?.[0];
  if (!action?.type) return '';
  const label = metadata?.actions?.find((a) => a.value === action.type)?.label || action.type;
  if (action.type === 'start_workflow') {
    const target = action.template_trigger_category || action.template_id;
    return target ? `${label} (${target})` : label;
  }
  return label;
}

function canDryRunRule(rule, canManage) {
  return Boolean(rule.can_edit || (rule.is_global && canManage));
}

function RuleCard({
  rule,
  metadata,
  editingRuleId,
  canManage,
  onEdit,
  onDuplicate,
  onToggle,
  onDryRun,
  onDelete,
}) {
  return (
    <Card className={`p-4 ${editingRuleId === rule.id ? 'ring-2 ring-primary-500/40' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
            {rule.is_global && (
              <Badge variant="secondary" className="text-[10px]" title="ResolveMeQ platform starter — copy to your workspace to edit">
                Platform starter
              </Badge>
            )}
            {!rule.is_active && <Badge variant="warning" className="text-[10px]">Paused</Badge>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {metadata?.triggers?.find((t) => t.value === rule.trigger)?.label || rule.trigger}
            {rule.trigger === 'schedule.cron' && rule.cron_expression && (
              <> (<span className="font-mono">{rule.cron_expression}</span>)</>
            )}
            {rule.conditions?.length > 0 && (
              <> · if {rule.conditions[0].field} {rule.conditions[0].op || 'equals'} {String(rule.conditions[0].value)}</>
            )}
            {' · '}
            {actionSummary(rule, metadata)}
          </p>
          {rule.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{rule.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1 shrink-0">
          {rule.is_global && canManage && (
            <Button variant="outline" size="sm" onClick={() => onDuplicate(rule)} title="Create an editable copy in your workspace">
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy to workspace
            </Button>
          )}
          {rule.can_edit && (
            <>
              <button
                type="button"
                onClick={() => onEdit(rule)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Edit rule"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggle(rule)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                title={rule.is_active ? 'Pause rule' : 'Activate rule'}
              >
                {rule.is_active ? <ToggleRight className="w-5 h-5 text-primary-600" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </>
          )}
          {canDryRunRule(rule, canManage) && (
            <button
              type="button"
              onClick={() => onDryRun(rule)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Dry run"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {rule.can_edit && (
            <button
              type="button"
              onClick={() => onDelete(rule)}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

const AutomationRules = ({ activeTeamId }) => {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setEditingRuleId(null);
    setForm(EMPTY_FORM);
  };

  const openCreateForm = () => {
    setEditingRuleId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  };

  const openEditForm = (rule) => {
    setEditingRuleId(rule.id);
    setForm(ruleToForm(rule));
    setShowForm(true);
    setError(null);
  };

  const openDuplicateForm = (rule) => {
    const base = ruleToForm(rule);
    setEditingRuleId(null);
    setForm({
      ...base,
      name: `${rule.name} (my copy)`.slice(0, 200),
      description: rule.description || '',
    });
    setShowForm(true);
    setError(null);
  };

  const workspaceRules = rules.filter((r) => !r.is_global);
  const globalRules = rules.filter((r) => r.is_global);
  const showRuleForm = showForm && (editingRuleId != null || canManage);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, logsRes, metaRes] = await Promise.all([
        api.automation.listRules(),
        api.automation.logs().catch(() => ({ logs: [] })),
        api.automation.metadata(),
      ]);
      setRules(rulesRes?.rules || []);
      setCanManage(Boolean(rulesRes?.can_manage));
      setLogs(logsRes?.logs || []);
      setMetadata(metaRes);
    } catch (e) {
      setError(e?.message || 'Could not load automation rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, activeTeamId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(form);
      if (editingRuleId) {
        await api.automation.updateRule(editingRuleId, payload);
      } else {
        await api.automation.createRule({ ...payload, is_active: true });
      }
      closeForm();
      load();
    } catch (err) {
      setError(err?.message || `Could not ${editingRuleId ? 'update' : 'create'} rule.`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule) => {
    if (!rule.can_edit) return;
    try {
      await api.automation.updateRule(rule.id, { is_active: !rule.is_active });
      load();
    } catch (err) {
      setError(err?.message || 'Could not update rule.');
    }
  };

  const handleDelete = (rule) => {
    if (!rule.can_edit) return;
    setDeleteTarget(rule);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.can_edit) return;
    setDeleting(true);
    try {
      await api.automation.deleteRule(deleteTarget.id);
      if (editingRuleId === deleteTarget.id) closeForm();
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err?.message || 'Could not delete rule.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDryRun = async (rule) => {
    setTestResult(null);
    try {
      const res = await api.automation.dryRunRule(rule.id, {});
      setTestResult(res?.logs?.[0]?.message || 'Dry run completed.');
    } catch (err) {
      setTestResult(err?.message || 'Dry run failed.');
    }
  };

  const renderActionFields = () => {
    switch (form.action_type) {
      case 'start_workflow':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template category</label>
              <input
                value={form.template_trigger_category}
                onChange={(e) => setForm((f) => ({ ...f, template_trigger_category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="onboarding"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Or template ID</label>
              <input
                value={form.template_id}
                onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="UUID (overrides category)"
              />
            </div>
          </div>
        );
      case 'notify_slack':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Slack channel ID (optional)</label>
              <input
                value={form.notify_channel_id}
                onChange={(e) => setForm((f) => ({ ...f, notify_channel_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="Uses ops channel if empty"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message (optional)</label>
              <input
                value={form.notify_message}
                onChange={(e) => setForm((f) => ({ ...f, notify_message: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="Defaults to ticket summary"
              />
            </div>
          </div>
        );
      case 'notify_teams':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message (optional)</label>
            <input
              value={form.notify_message}
              onChange={(e) => setForm((f) => ({ ...f, notify_message: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              placeholder="Defaults to ticket summary"
            />
          </div>
        );
      case 'assign_ticket':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assign to user ID</label>
            <input
              value={form.assign_user_id}
              onChange={(e) => setForm((f) => ({ ...f, assign_user_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              required
            />
          </div>
        );
      case 'set_field':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ticket field</label>
              <input
                value={form.set_field_name}
                onChange={(e) => setForm((f) => ({ ...f, set_field_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="status"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Value</label>
              <input
                value={form.set_field_value}
                onChange={(e) => setForm((f) => ({ ...f, set_field_value: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        );
      case 'call_webhook':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Webhook URL</label>
            <input
              value={form.webhook_url}
              onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              placeholder="https://..."
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  const knownConditionFields = metadata?.condition_fields || [];
  const isCustomField = form.condition_field === CUSTOM_OPTION
    || (form.condition_field && !knownConditionFields.some((f) => f.value === form.condition_field));
  const selectedField = knownConditionFields.find((f) => f.value === form.condition_field);
  const valueChoices = selectedField?.choices || [];
  const isCustomValue = valueChoices.length === 0
    || form.condition_value === CUSTOM_OPTION
    || (form.condition_value && !valueChoices.some((c) => c.value === form.condition_value));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Link to="/workflows" className="inline-flex items-center text-xs text-primary-600 dark:text-primary-400 hover:underline mb-4">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to workflows
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Automation rules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            When something happens, run actions — start playbooks, assign tickets, and more.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => (showForm && !editingRuleId ? closeForm() : openCreateForm())}>
            <Plus className="w-4 h-4 mr-1.5" />
            New rule
          </Button>
        )}
      </div>

      {error && (
        <Card className="p-3 mb-4 text-sm text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50">
          {error}
        </Card>
      )}

      {!activeTeamId && !loading && (
        <WorkspaceRequiredBanner title="Select a workspace to manage automation rules" />
      )}

      {activeTeamId && !canManage && !loading && (
        <Card className="p-3 mb-4 text-sm text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20">
          View-only: ask your workspace owner to grant <span className="font-medium">Playbooks &amp; automation rules</span> under Teams → Assign roles.
        </Card>
      )}

      {activeTeamId && canManage && globalRules.length > 0 && !loading && (
        <Card className="p-3 mb-4 text-sm text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
          <strong className="text-gray-900 dark:text-white">Your workspace rules</strong> are fully editable.
          {' '}<strong className="text-gray-900 dark:text-white">Platform starters</strong> below are read-only examples — use <span className="font-medium">Copy to workspace</span> to customize.
        </Card>
      )}

      {testResult && (
        <Card className="p-3 mb-4 text-sm text-gray-700 dark:text-gray-300 border-primary-200 dark:border-primary-800">
          <strong className="text-primary-600 dark:text-primary-400">Test result:</strong> {testResult}
        </Card>
      )}

      {showRuleForm && (
        <Card className="p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {editingRuleId ? 'Edit rule' : 'New rule'}
          </h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                placeholder="Auto-start onboarding"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (optional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">When (trigger)</label>
                <select
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  {(metadata?.triggers || []).map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
            {form.trigger === 'schedule.cron' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cron schedule (UTC)</label>
                <input
                  value={form.cron_expression}
                  onChange={(e) => setForm((f) => ({ ...f, cron_expression: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-mono"
                  placeholder="0 9 * * 1"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                  5-field cron, UTC. Example: <span className="font-mono">0 9 * * 1</span> = every Monday at 09:00 UTC.
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">If field matches (leave value empty = always)</label>
              <div className="flex flex-wrap gap-2">
                {isCustomField ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={form.condition_field === CUSTOM_OPTION ? '' : form.condition_field}
                      onChange={(e) => setForm((f) => ({ ...f, condition_field: e.target.value }))}
                      className="w-28 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                      placeholder="custom_field"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        condition_field: knownConditionFields[0]?.value || 'category',
                        condition_value: '',
                      }))}
                      className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap"
                    >
                      Pick from list
                    </button>
                  </div>
                ) : (
                  <select
                    value={form.condition_field}
                    onChange={(e) => setForm((f) => ({ ...f, condition_field: e.target.value, condition_value: '' }))}
                    className="w-36 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  >
                    {knownConditionFields.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                    <option value={CUSTOM_OPTION}>Other (type manually)…</option>
                  </select>
                )}
                <select
                  value={form.condition_op}
                  onChange={(e) => setForm((f) => ({ ...f, condition_op: e.target.value }))}
                  className="w-32 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  {(metadata?.condition_ops || [{ value: 'equals', label: 'Equals' }]).map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {isCustomValue ? (
                  <div className="flex items-center gap-1 flex-1 min-w-[8rem]">
                    <input
                      value={form.condition_value === CUSTOM_OPTION ? '' : form.condition_value}
                      onChange={(e) => setForm((f) => ({ ...f, condition_value: e.target.value }))}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                      placeholder="onboarding"
                    />
                    {valueChoices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, condition_value: '' }))}
                        className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap"
                      >
                        Pick from list
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value={form.condition_value}
                    onChange={(e) => setForm((f) => ({ ...f, condition_value: e.target.value }))}
                    className="flex-1 min-w-[8rem] px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Any value (leave empty = always)</option>
                    {valueChoices.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                    <option value={CUSTOM_OPTION}>Other (type manually)…</option>
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Then (action)</label>
              <select
                value={form.action_type}
                onChange={(e) => setForm((f) => ({ ...f, action_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                {(metadata?.actions || []).map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            {renderActionFields()}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                {editingRuleId ? 'Save changes' : 'Create rule'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 animate-pulse h-24" />
      ) : rules.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No rules yet. Create one above to automate what happens when a ticket matches a condition.
        </Card>
      ) : (
        <div className="space-y-6">
          {workspaceRules.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Your workspace rules ({workspaceRules.length})
              </h2>
              <div className="space-y-3">
                {workspaceRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    metadata={metadata}
                    editingRuleId={editingRuleId}
                    canManage={canManage}
                    onEdit={openEditForm}
                    onDuplicate={openDuplicateForm}
                    onToggle={toggleActive}
                    onDryRun={handleDryRun}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
          {workspaceRules.length === 0 && canManage && globalRules.length > 0 && (
            <Card className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No workspace rules yet. Copy a platform starter below or create your own with <span className="font-medium">New rule</span>.
            </Card>
          )}
          {globalRules.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Platform starters ({globalRules.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Shipped by ResolveMeQ for every workspace. Read-only — duplicate to customize.
              </p>
              <div className="space-y-3">
                {globalRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    metadata={metadata}
                    editingRuleId={editingRuleId}
                    canManage={canManage}
                    onEdit={openEditForm}
                    onDuplicate={openDuplicateForm}
                    onToggle={toggleActive}
                    onDryRun={handleDryRun}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent executions</h2>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                <Badge variant={log.status === 'success' ? 'success' : log.status === 'failed' ? 'error' : 'secondary'} className="text-[10px] mr-2">
                  {log.status}
                </Badge>
                {log.rule_name || log.trigger}
                {log.ticket_id ? ` · ticket #${log.ticket_id}` : ''}
                {log.message ? ` — ${log.message}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >
            <Card className="w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete rule?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                &ldquo;{deleteTarget.name}&rdquo; will be removed and will stop running immediately.
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" loading={deleting} onClick={confirmDelete} className="!bg-red-600 hover:!bg-red-700">
                  Delete
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutomationRules;
