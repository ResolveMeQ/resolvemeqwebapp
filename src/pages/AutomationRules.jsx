import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Plus, ArrowLeft, Play, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';

const EMPTY_FORM = {
  name: '',
  description: '',
  trigger: 'ticket.created',
  condition_field: 'category',
  condition_value: '',
  action_type: 'start_workflow',
  template_trigger_category: 'onboarding',
  priority: 100,
};

const AutomationRules = () => {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

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
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const conditions = form.condition_value.trim()
        ? [{ field: form.condition_field.trim() || 'category', op: 'equals', value: form.condition_value.trim() }]
        : [];
      const actions =
        form.action_type === 'start_workflow'
          ? [{ type: 'start_workflow', template_trigger_category: form.template_trigger_category.trim() }]
          : [{ type: form.action_type }];
      await api.automation.createRule({
        name: form.name.trim(),
        description: form.description.trim(),
        trigger: form.trigger,
        conditions,
        actions,
        priority: Number(form.priority) || 100,
        is_active: true,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err?.message || 'Could not create rule.');
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

  const handleDelete = async (rule) => {
    if (!rule.can_edit || !window.confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await api.automation.deleteRule(rule.id);
      load();
    } catch (err) {
      setError(err?.message || 'Could not delete rule.');
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
          <Button variant="primary" size="sm" onClick={() => setShowForm((s) => !s)}>
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

      {testResult && (
        <Card className="p-3 mb-4 text-sm text-gray-700 dark:text-gray-300 border-primary-200 dark:border-primary-800">
          <strong className="text-primary-600 dark:text-primary-400">Test result:</strong> {testResult}
        </Card>
      )}

      {showForm && canManage && (
        <Card className="p-4 mb-6">
          <form onSubmit={handleCreate} className="space-y-3">
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
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">If field equals</label>
                <div className="flex gap-2">
                  <input
                    value={form.condition_field}
                    onChange={(e) => setForm((f) => ({ ...f, condition_field: e.target.value }))}
                    className="w-1/3 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    placeholder="category"
                  />
                  <input
                    value={form.condition_value}
                    onChange={(e) => setForm((f) => ({ ...f, condition_value: e.target.value }))}
                    className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    placeholder="onboarding (leave empty = always)"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {form.action_type === 'start_workflow' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Template category</label>
                  <input
                    value={form.template_trigger_category}
                    onChange={(e) => setForm((f) => ({ ...f, template_trigger_category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>Create rule</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 animate-pulse h-24" />
      ) : rules.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No rules yet. Run <code className="text-xs">python manage.py seed_automation_rules</code> on the server or create one above.
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                    {rule.is_global && <Badge variant="secondary" className="text-[10px]">Global</Badge>}
                    {!rule.is_active && <Badge variant="warning" className="text-[10px]">Paused</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metadata?.triggers?.find((t) => t.value === rule.trigger)?.label || rule.trigger}
                    {rule.conditions?.length > 0 && (
                      <> · if {rule.conditions[0].field} = {String(rule.conditions[0].value)}</>
                    )}
                  </p>
                  {rule.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{rule.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {rule.can_edit && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleActive(rule)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                      >
                        {rule.is_active ? <ToggleRight className="w-5 h-5 text-primary-600" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDryRun(rule)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Dry run"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
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
    </div>
  );
};

export default AutomationRules;
