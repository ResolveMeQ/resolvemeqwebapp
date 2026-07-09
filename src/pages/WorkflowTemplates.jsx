import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  ArrowLeft,
  Search,
  Globe,
  Building2,
  Copy,
  Play,
  Clock,
  Users,
  UserPlus,
  ShieldCheck,
  Bot,
  Hand,
  LayoutTemplate,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import { api } from '../services/api';
import { cn } from '../utils/cn';

const EMPTY_STEP = () => ({
  title: '',
  description: '',
  assignee_team: '',
  assignee_role: '',
  step_type: 'manual',
  due_days: 2,
  auto_complete: false,
  auto_assign: '',
  skip_when: null,
  skip_field: '',
  skip_equals: '',
  auto_check_connector: 'okta',
  auto_check_check: 'user_exists',
  auto_check_group_id: '',
  auto_check_sku_id: '',
});

const STEP_TYPE_META = {
  manual: {
    label: 'Manual',
    icon: Hand,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    hint: 'A teammate claims and completes this step.',
  },
  approval: {
    label: 'Approval',
    icon: ShieldCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    hint: 'Requires explicit approval before the workflow advances.',
  },
  auto_check: {
    label: 'Auto check',
    icon: Bot,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    hint: 'Connector verifies automatically (Okta user exists, etc.).',
  },
};

const AUTO_ASSIGN_OPTIONS = [
  { value: '', label: 'Anyone can claim' },
  { value: 'started_by', label: 'Who started the workflow' },
  { value: 'ticket_reporter', label: 'Ticket reporter' },
];

const CONNECTOR_CHECK_OPTIONS = {
  okta: [
    { value: 'user_exists', label: 'User exists' },
    { value: 'group_member', label: 'Group member' },
  ],
  google_workspace: [
    { value: 'user_exists', label: 'User exists' },
    { value: 'has_license', label: 'Has license SKU' },
  ],
  microsoft365: [
    { value: 'user_exists', label: 'User exists' },
    { value: 'has_license', label: 'Has license SKU' },
  ],
};

const STARTER_PLAYBOOKS = [
  {
    id: 'onboarding',
    name: 'Employee onboarding',
    description: 'Accounts, hardware, orientation — day-one ready.',
    trigger_category: 'onboarding',
    accent: 'border-l-emerald-400 dark:border-l-emerald-600',
    steps: [
      { title: 'Provision accounts', description: 'Email, SSO, and core apps.', assignee_team: 'IT Support', assignee_role: 'it', step_type: 'manual', due_days: 1 },
      { title: 'Assign hardware', description: 'Laptop and peripherals.', assignee_team: 'IT Support', assignee_role: 'it', step_type: 'manual', due_days: 2 },
      { title: 'Manager sign-off', description: 'Confirm hire details and start date.', assignee_team: 'HR', assignee_role: 'hr', step_type: 'approval', due_days: 2 },
      { title: 'Schedule orientation', description: 'Book sessions and share week-one plan.', assignee_team: 'HR', assignee_role: 'hr', step_type: 'manual', due_days: 3 },
    ],
  },
  {
    id: 'offboarding',
    name: 'Employee offboarding',
    description: 'Revoke access, collect gear, close accounts.',
    trigger_category: 'offboarding',
    accent: 'border-l-orange-400 dark:border-l-orange-600',
    steps: [
      { title: 'Revoke system access', description: 'Disable SSO and SaaS accounts.', assignee_team: 'IT Support', step_type: 'manual', due_days: 1 },
      { title: 'Collect hardware', description: 'Laptop, badge, keys.', assignee_team: 'IT Support', step_type: 'manual', due_days: 2 },
      { title: 'HR exit checklist', description: 'Final payroll and documentation.', assignee_team: 'HR', step_type: 'approval', due_days: 3 },
    ],
  },
  {
    id: 'provisioning',
    name: 'Equipment provisioning',
    description: 'Software, licenses, and device delivery.',
    trigger_category: 'provisioning',
    accent: 'border-l-primary-400 dark:border-l-primary-600',
    steps: [
      { title: 'Confirm request details', description: 'What is needed and by when.', assignee_team: 'IT Support', step_type: 'manual', due_days: 1 },
      { title: 'Provision access', description: 'Licenses and permissions.', assignee_team: 'IT Support', step_type: 'manual', due_days: 2 },
      { title: 'Deliver to requester', description: 'Ship or hand off with tracking.', assignee_team: 'IT Support', step_type: 'manual', due_days: 3 },
    ],
  },
];

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500';
const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5';

function categoryLabel(categories, value) {
  if (!value) return 'Manual start';
  const hit = categories.find((c) => c.value === value);
  return hit?.label || value.replace(/_/g, ' ');
}

/** Vertical pipeline preview — used on cards and in the editor sidebar. */
function PipelinePreview({ steps, compact = false, maxVisible = 5 }) {
  const visible = (steps || []).slice(0, maxVisible);
  const overflow = (steps?.length || 0) - visible.length;

  if (!visible.length) {
    return <p className="text-xs text-gray-400 italic">No steps yet</p>;
  }

  return (
    <ol className={cn('relative', compact ? 'space-y-1.5' : 'space-y-2')}>
      {visible.map((step, idx) => {
        const meta = STEP_TYPE_META[step.step_type] || STEP_TYPE_META.manual;
        const Icon = meta.icon;
        const isLast = idx === visible.length - 1 && overflow <= 0;
        return (
          <li key={idx} className="flex gap-2.5 items-start">
            <div className="flex flex-col items-center shrink-0">
              <span
                className={cn(
                  'flex items-center justify-center rounded-full border',
                  compact ? 'w-6 h-6' : 'w-7 h-7',
                  meta.bg,
                  'border-gray-200 dark:border-gray-700'
                )}
              >
                <Icon className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5', meta.color)} />
              </span>
              {!isLast && (
                <span className="w-px flex-1 min-h-[10px] bg-gray-200 dark:bg-gray-700 my-0.5" aria-hidden />
              )}
            </div>
            <div className={cn('min-w-0 pb-1', !isLast && (compact ? 'pb-2' : 'pb-3'))}>
              <p className={cn('font-medium text-gray-900 dark:text-white truncate', compact ? 'text-xs' : 'text-sm')}>
                {step.title || 'Untitled step'}
              </p>
              {!compact && step.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{step.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {meta.label}
                </Badge>
                {step.due_days != null && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {step.due_days}d SLA
                  </span>
                )}
                {step.assignee_team && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {step.assignee_team}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
      {overflow > 0 && (
        <li className="text-xs text-gray-400 pl-9">+{overflow} more step{overflow === 1 ? '' : 's'}</li>
      )}
    </ol>
  );
}

function StepEditorCard({
  step,
  index,
  total,
  assigneeRoles,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  expanded,
  onToggleExpand,
}) {
  const meta = STEP_TYPE_META[step.step_type] || STEP_TYPE_META.manual;
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 shadow-sm overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg shrink-0', meta.bg)}>
          <Icon className={cn('w-4 h-4', meta.color)} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {step.title.trim() || `Step ${index + 1}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{meta.label} · due in {step.due_days || 2} days</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25"
            aria-label="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25"
            aria-label="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-md text-gray-400 hover:text-primary-600"
            aria-label="Duplicate step"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 disabled:opacity-25"
            aria-label="Remove step"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  value={step.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Provision Okta account"
                />
              </div>
              <div>
                <label className={labelClass}>Instructions</label>
                <textarea
                  value={step.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  rows={2}
                  className={cn(inputClass, 'resize-y min-h-[72px]')}
                  placeholder="What should the assignee do?"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Assignee label</label>
                  <input
                    value={step.assignee_team}
                    onChange={(e) => onChange({ assignee_team: e.target.value })}
                    className={inputClass}
                    placeholder="IT Support"
                  />
                </div>
                <div>
                  <label className={labelClass}>Claim role</label>
                  <select
                    value={step.assignee_role || ''}
                    onChange={(e) => {
                      const role = e.target.value;
                      const label = assigneeRoles.find((r) => r.value === role)?.label;
                      onChange({
                        assignee_role: role,
                        assignee_team: step.assignee_team || (label && label !== 'Anyone' ? label : step.assignee_team),
                      });
                    }}
                    className={inputClass}
                  >
                    {assigneeRoles.map((r) => (
                      <option key={r.value || 'anyone'} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Due (days)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={step.due_days}
                    onChange={(e) => onChange({ due_days: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Step type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(STEP_TYPE_META).map(([value, m]) => {
                    const TypeIcon = m.icon;
                    const selected = step.step_type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onChange({ step_type: value })}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-all',
                          selected
                            ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20 ring-1 ring-primary-500/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <TypeIcon className={cn('w-4 h-4 mb-1.5', m.color)} />
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{m.label}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{m.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              {step.step_type === 'auto_check' && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Auto check (connector)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Connector</label>
                      <select
                        value={step.auto_check_connector || 'okta'}
                        onChange={(e) => {
                          const connector = e.target.value;
                          const checks = CONNECTOR_CHECK_OPTIONS[connector] || [];
                          onChange({
                            auto_check_connector: connector,
                            auto_check_check: checks[0]?.value || 'user_exists',
                          });
                        }}
                        className={inputClass}
                      >
                        <option value="okta">Okta</option>
                        <option value="google_workspace">Google Workspace</option>
                        <option value="microsoft365">Microsoft 365</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Check</label>
                      <select
                        value={step.auto_check_check || 'user_exists'}
                        onChange={(e) => onChange({ auto_check_check: e.target.value })}
                        className={inputClass}
                      >
                        {(CONNECTOR_CHECK_OPTIONS[step.auto_check_connector || 'okta'] || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {step.auto_check_connector === 'okta' && step.auto_check_check === 'group_member' && (
                    <div>
                      <label className={labelClass}>Okta group ID</label>
                      <input
                        value={step.auto_check_group_id || ''}
                        onChange={(e) => onChange({ auto_check_group_id: e.target.value })}
                        className={inputClass}
                        placeholder="00g..."
                      />
                    </div>
                  )}
                  {step.auto_check_check === 'has_license' && (
                    <div>
                      <label className={labelClass}>License SKU ID</label>
                      <input
                        value={step.auto_check_sku_id || ''}
                        onChange={(e) => onChange({ auto_check_sku_id: e.target.value })}
                        className={inputClass}
                        placeholder="Google-Apps-For-Business or ENTERPRISEPACK"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Uses ticket reporter email. Connect the IdP in Settings → Integrations.
                  </p>
                </div>
              )}
              <details className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <summary className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  Advanced automation
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(step.auto_complete)}
                      onChange={(e) => onChange({ auto_complete: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Auto-complete when step becomes active
                  </label>
                  <div>
                    <label className={labelClass}>Auto-assign to</label>
                    <select
                      value={step.auto_assign}
                      onChange={(e) => onChange({ auto_assign: e.target.value })}
                      className={inputClass}
                    >
                      {AUTO_ASSIGN_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Branching (skip when ticket matches)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Ticket field</label>
                        <input
                          value={step.skip_field || ''}
                          onChange={(e) => onChange({ skip_field: e.target.value })}
                          className={inputClass}
                          placeholder="category"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Skip if equals</label>
                        <input
                          value={step.skip_equals || ''}
                          onChange={(e) => onChange({ skip_equals: e.target.value })}
                          className={inputClass}
                          placeholder="Leave empty to never skip"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const WorkflowTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', trigger_category: '', steps: [EMPTY_STEP()] });
  const [expandedStepIdx, setExpandedStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showStarters, setShowStarters] = useState(false);
  const [assigneeRoles, setAssigneeRoles] = useState([{ value: '', label: 'Anyone' }]);
  const [onboardingSku, setOnboardingSku] = useState(null);
  const [onboardingPanelOpen, setOnboardingPanelOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, catsRes, rolesRes, skuRes] = await Promise.all([
        api.workflows.listTemplatesManage(),
        api.tickets.getCategories().catch(() => ({ categories: [] })),
        api.workflows.assigneeRoles().catch(() => ({ roles: [] })),
        api.workflows.onboardingPlaybook().catch(() => null),
      ]);
      setTemplates(data?.templates || []);
      setCanManage(Boolean(data?.can_manage));
      setCategories(catsRes?.categories || []);
      if (rolesRes?.roles?.length) setAssigneeRoles(rolesRes.roles);
      setOnboardingSku(skuRes?.playbook || null);
    } catch (e) {
      setError(e?.message || 'Could not load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!editorOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) setEditorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorOpen, saving]);

  const stats = useMemo(() => {
    const team = templates.filter((t) => !t.is_global).length;
    const global = templates.filter((t) => t.is_global).length;
    const auto = templates.filter((t) => t.trigger_category).length;
    const editable = templates.filter((t) => t.can_edit).length;
    return { total: templates.length, team, global, auto, editable };
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (scopeFilter === 'team' && t.is_global) return false;
      if (scopeFilter === 'global' && !t.is_global) return false;
      if (scopeFilter === 'editable' && !t.can_edit) return false;
      if (scopeFilter === 'auto' && !t.trigger_category) return false;
      if (!q) return true;
      const cat = categoryLabel(categories, t.trigger_category).toLowerCase();
      return t.name.toLowerCase().includes(q) || cat.includes(q);
    });
  }, [templates, search, scopeFilter, categories]);

  const openCreateBlank = () => {
    setEditorMode('create');
    setEditingId(null);
    setForm({ name: '', trigger_category: '', steps: [EMPTY_STEP()] });
    setExpandedStepIdx(0);
    setFormError(null);
    setShowStarters(false);
    setEditorOpen(true);
  };

  const openCreateFromStarter = (starter) => {
    setEditorMode('create');
    setEditingId(null);
    setForm({
      name: starter.name,
      trigger_category: starter.trigger_category,
      steps: starter.steps.map((s) => ({
        ...EMPTY_STEP(),
        ...s,
        auto_complete: false,
        auto_assign: '',
      })),
    });
    setExpandedStepIdx(0);
    setFormError(null);
    setShowStarters(false);
    setEditorOpen(true);
  };

  const openEdit = (tpl) => {
    if (!tpl.can_edit) return;
    setEditorMode('edit');
    setEditingId(tpl.id);
    setForm({
      name: tpl.name || '',
      trigger_category: tpl.trigger_category || '',
      steps: (tpl.steps?.length ? tpl.steps : [EMPTY_STEP()]).map((s) => ({
        title: s.title || '',
        description: s.description || '',
        assignee_team: s.assignee_team || '',
        assignee_role: s.assignee_role || '',
        step_type: s.step_type || 'manual',
        due_days: s.due_days ?? 2,
        auto_complete: Boolean(s.auto_complete),
        auto_assign: s.auto_assign || '',
        skip_field: s.skip_when?.ticket_field || '',
        skip_equals: s.skip_when?.equals ?? '',
        auto_check_connector: s.auto_check?.connector || 'okta',
        auto_check_check: s.auto_check?.check || 'user_exists',
        auto_check_group_id: s.auto_check?.group_id || '',
        auto_check_sku_id: s.auto_check?.sku_id || '',
      })),
    });
    setExpandedStepIdx(0);
    setFormError(null);
    setEditorOpen(true);
  };

  const openDuplicate = (tpl) => {
    if (!canManage) return;
    setEditorMode('create');
    setEditingId(null);
    setForm({
      name: `${tpl.name} (copy)`,
      trigger_category: tpl.trigger_category || '',
      steps: (tpl.steps || [EMPTY_STEP()]).map((s) => ({
        title: s.title || '',
        description: s.description || '',
        assignee_team: s.assignee_team || '',
        assignee_role: s.assignee_role || '',
        step_type: s.step_type || 'manual',
        due_days: s.due_days ?? 2,
        auto_complete: Boolean(s.auto_complete),
        auto_assign: s.auto_assign || '',
        skip_field: s.skip_when?.ticket_field || '',
        skip_equals: s.skip_when?.equals ?? '',
        auto_check_connector: s.auto_check?.connector || 'okta',
        auto_check_check: s.auto_check?.check || 'user_exists',
        auto_check_group_id: s.auto_check?.group_id || '',
        auto_check_sku_id: s.auto_check?.sku_id || '',
      })),
    });
    setExpandedStepIdx(0);
    setFormError(null);
    setEditorOpen(true);
  };

  const updateStep = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const moveStep = (index, dir) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      const target = index + dir;
      if (target < 0 || target >= steps.length) return prev;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...prev, steps };
    });
    setExpandedStepIdx((i) => (i === index ? index + dir : i));
  };

  const duplicateStep = (index) => {
    setForm((prev) => {
      const copy = { ...prev.steps[index], title: `${prev.steps[index].title} (copy)`.trim() };
      const steps = [...prev.steps];
      steps.splice(index + 1, 0, copy);
      return { ...prev, steps };
    });
    setExpandedStepIdx(index + 1);
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Give your playbook a name.';
    const bad = form.steps.findIndex((s) => !s.title.trim());
    if (bad >= 0) return `Step ${bad + 1} needs a title.`;
    return null;
  };

  const handleSave = async () => {
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        trigger_category: form.trigger_category || '',
        steps: form.steps.map((s) => {
          const step = {
            title: s.title.trim(),
            description: s.description.trim(),
            assignee_team: s.assignee_team.trim(),
            assignee_role: s.assignee_role || '',
            step_type: s.step_type,
            due_days: Number(s.due_days) || 2,
            auto_complete: Boolean(s.auto_complete),
            auto_assign: s.auto_assign || '',
          };
          const field = (s.skip_field || '').trim();
          const equals = (s.skip_equals ?? '').toString().trim();
          if (field && equals) {
            step.skip_when = { ticket_field: field, equals };
          }
          if (s.step_type === 'auto_check') {
            step.auto_check = {
              connector: s.auto_check_connector || 'okta',
              check: s.auto_check_check || 'user_exists',
              email_from: 'ticket_reporter',
            };
            if (s.auto_check_check === 'group_member' && (s.auto_check_group_id || '').trim()) {
              step.auto_check.group_id = s.auto_check_group_id.trim();
            }
            if (s.auto_check_check === 'has_license' && (s.auto_check_sku_id || '').trim()) {
              step.auto_check.sku_id = s.auto_check_sku_id.trim();
            }
          }
          return step;
        }),
      };
      if (editingId) {
        await api.workflows.updateTemplate(editingId, payload);
        showToast('Playbook updated.');
      } else {
        await api.workflows.createTemplate(payload);
        showToast('Playbook created — ready to run.');
      }
      setEditorOpen(false);
      load();
    } catch (e) {
      setFormError(e?.message || 'Could not save template.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.can_edit) return;
    setDeleting(true);
    try {
      await api.workflows.deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Playbook deleted.');
      load();
    } catch (e) {
      setError(e?.message || 'Could not delete template.');
    } finally {
      setDeleting(false);
    }
  };

  const scopeFilters = [
    { id: 'all', label: 'All' },
    { id: 'team', label: 'Team' },
    { id: 'global', label: 'Global' },
    { id: 'auto', label: 'Auto-start' },
    ...(canManage ? [{ id: 'editable', label: 'Yours to edit' }] : []),
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-16">
      {/* Hero */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm mb-6">
        <div className="p-6 md:p-8">
          <Link
            to="/workflows"
            className="inline-flex items-center text-xs text-primary-600 dark:text-primary-400 hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to active workflows
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="primary" className="mb-3 gap-1">
                <LayoutTemplate className="w-3 h-3" />
                Playbook library
              </Badge>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Workflow templates
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
                Curated multi-step playbooks your team runs every day: onboarding, provisioning, offboarding.
                Auto-start from ticket categories or launch manually.
              </p>
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowStarters(true)}>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Start from template
                </Button>
                <Button variant="primary" size="sm" onClick={openCreateBlank}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  New playbook
                </Button>
              </div>
            )}
          </div>
          {!loading && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total playbooks" value={stats.total} icon={ListChecks} tone="primary" />
              <StatCard label="Team-owned" value={stats.team} icon={Building2} tone="blue" />
              <StatCard label="Auto-triggered" value={stats.auto} icon={Zap} tone="amber" />
              <StatCard label="You can edit" value={stats.editable} icon={Pencil} tone="gray" />
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <Card className="p-4 mb-6 bg-gray-50 dark:bg-gray-900/30">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          How playbooks work
        </p>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400 list-none">
          <li>
            <strong className="text-gray-800 dark:text-gray-200">1. Define steps</strong> — sequential tasks with owners, SLAs, and approval gates.
          </li>
          <li>
            <strong className="text-gray-800 dark:text-gray-200">2. Auto-start or manual</strong> — match a ticket category or start from Workflows.
          </li>
          <li>
            <strong className="text-gray-800 dark:text-gray-200">3. Notify & track</strong> — Slack/Teams alerts, overdue badges, ticket resolves on completion.
          </li>
        </ol>
      </Card>

      {error && (
        <Card className="p-4 mb-4 border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </Card>
      )}

      {!canManage && !loading && (
        <Card className="p-4 mb-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 text-sm text-amber-900 dark:text-amber-200">
          View-only: workspace owners create team playbooks. Global templates are maintained by ResolveMeQ.
        </Card>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search playbooks or categories…"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {scopeFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setScopeFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                scopeFilter === f.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10">
          <EmptyState
            icon={LayoutTemplate}
            title={search || scopeFilter !== 'all' ? 'No playbooks match your filters' : 'No playbooks yet'}
            description={
              canManage
                ? 'Start from a proven template or build a custom playbook for your team.'
                : 'Ask your workspace owner to create playbooks for common IT processes.'
            }
            action={
              canManage && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowStarters(true)}>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Browse starters
                  </Button>
                  <Button variant="primary" size="sm" onClick={openCreateBlank}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create playbook
                  </Button>
                </div>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {filtered.map((tpl) => {
              const isExpanded = expandedId === tpl.id;
              const catLabel = categoryLabel(categories, tpl.trigger_category);
              return (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card
                    className={cn(
                      'overflow-hidden transition-shadow hover:shadow-md',
                      isExpanded && 'ring-1 ring-primary-500/30'
                    )}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {tpl.name}
                            </h3>
                            {tpl.is_global ? (
                              <Badge variant="secondary" className="gap-1 shrink-0">
                                <Globe className="w-3 h-3" />
                                Global
                              </Badge>
                            ) : (
                              <Badge variant="primary" className="gap-1 shrink-0">
                                <Building2 className="w-3 h-3" />
                                Team
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tpl.step_count} step{tpl.step_count === 1 ? '' : 's'}
                            <span className="mx-1.5">·</span>
                            {tpl.trigger_category ? (
                              <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400">
                                <Zap className="w-3 h-3" />
                                Auto on {catLabel}
                              </span>
                            ) : (
                              'Manual start'
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-expanded={isExpanded}
                        >
                          <ChevronRight
                            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
                          />
                        </button>
                      </div>

                      <div className="mt-4">
                        <PipelinePreview steps={tpl.steps} compact maxVisible={isExpanded ? 12 : 3} />
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => navigate('/workflows', { state: { startTemplateId: tpl.id } })}
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Run
                        </Button>
                        {canManage && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => openDuplicate(tpl)}>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Duplicate
                          </Button>
                        )}
                        {tpl.can_edit && (
                          <>
                            <Button variant="outline" size="sm" type="button" onClick={() => openEdit(tpl)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setDeleteTarget(tpl)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Starter picker */}
      <AnimatePresence>
        {showStarters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowStarters(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Start from a proven playbook</h2>
                  <button type="button" onClick={() => setShowStarters(false)} aria-label="Close">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                  Pre-built step sequences you can customize before saving to your workspace.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {STARTER_PLAYBOOKS.map((starter) => (
                    <button
                      key={starter.id}
                      type="button"
                      onClick={() => openCreateFromStarter(starter)}
                      className={cn(
                        'rounded-xl border border-l-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-left hover:shadow-sm transition-shadow',
                        starter.accent
                      )}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{starter.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{starter.description}</p>
                      <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-3 font-medium">
                        {starter.steps.length} steps · customize →
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <button
                    type="button"
                    className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={() => {
                      setShowStarters(false);
                      openCreateBlank();
                    }}
                  >
                    Or start blank
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => setShowStarters(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full editor */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute inset-y-0 right-0 w-full max-w-4xl bg-white dark:bg-gray-950 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {editorMode === 'edit' ? 'Edit playbook' : 'New playbook'}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {form.name.trim() || 'Untitled playbook'}
                  </h2>
                </div>
                <button type="button" onClick={() => !saving && setEditorOpen(false)} aria-label="Close editor">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:gap-6 p-5 lg:p-6 min-h-full">
                  <div className="lg:col-span-3 space-y-5">
                    {formError && (
                      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {formError}
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>Playbook name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className={inputClass}
                        placeholder="Contractor offboarding"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>When to start</label>
                      <select
                        value={form.trigger_category}
                        onChange={(e) => setForm((p) => ({ ...p, trigger_category: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Manual only — start from Workflows page</option>
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>
                            Auto-start when ticket category is {c.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                        Auto-start attaches this playbook when someone opens a ticket in that category.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className={labelClass + ' mb-0'}>Steps ({form.steps.length})</label>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setForm((p) => ({ ...p, steps: [...p.steps, EMPTY_STEP()] }));
                            setExpandedStepIdx(form.steps.length);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add step
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {form.steps.map((step, idx) => (
                          <StepEditorCard
                            key={idx}
                            step={step}
                            index={idx}
                            total={form.steps.length}
                            assigneeRoles={assigneeRoles}
                            expanded={expandedStepIdx === idx}
                            onToggleExpand={() => setExpandedStepIdx((i) => (i === idx ? -1 : idx))}
                            onChange={(patch) => updateStep(idx, patch)}
                            onMove={(dir) => moveStep(idx, dir)}
                            onDuplicate={() => duplicateStep(idx)}
                            onRemove={() => {
                              if (form.steps.length <= 1) return;
                              setForm((p) => ({
                                ...p,
                                steps: p.steps.filter((_, i) => i !== idx),
                              }));
                              setExpandedStepIdx((i) => Math.max(0, Math.min(i, form.steps.length - 2)));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 mt-6 lg:mt-0">
                    <div className="lg:sticky lg:top-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 p-4">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Live preview
                      </p>
                      <PipelinePreview steps={form.steps} maxVisible={20} />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                        Steps run strictly in order. Completing the last step resolves any linked ticket and notifies the requester.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {form.steps.length} step{form.steps.length === 1 ? '' : 's'}
                  {form.trigger_category
                    ? ` · auto on ${categoryLabel(categories, form.trigger_category)}`
                    : ' · manual start'}
                </p>
                <div className="flex gap-2 ml-auto">
                  <Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditorOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                    {editorMode === 'edit' ? 'Save changes' : 'Create playbook'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >
            <Card className="w-full max-w-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete playbook?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                &ldquo;{deleteTarget.name}&rdquo; will be removed. Active workflows already started are not affected.
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

      {/* Onboarding pack — FAB + slide-up panel (keeps library layout clean) */}
      {onboardingSku && !editorOpen && !showStarters && !deleteTarget && (
        <>
          <AnimatePresence>
            {onboardingPanelOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[55] bg-black/30"
                  aria-label="Close onboarding panel"
                  onClick={() => setOnboardingPanelOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="fixed z-[56] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
                  style={{
                    bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
                    right: 'max(1.5rem, env(safe-area-inset-right, 0px))',
                  }}
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Featured playbook
                      </p>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                        {onboardingSku.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnboardingPanelOpen(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{onboardingSku.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                      <span className="rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800">
                        {onboardingSku.step_count} steps
                      </span>
                      <span className="rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800">
                        {onboardingSku.workflow_sla_days}-day SLA
                      </span>
                      <span className="rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800">
                        Auto: {onboardingSku.trigger_category}
                      </span>
                      {onboardingSku.connector_auto_steps > 0 && (
                        <span className="rounded-full px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                          {onboardingSku.connector_auto_steps} connector checks
                        </span>
                      )}
                    </div>
                    {onboardingSku.metrics?.workflows_started > 0 && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {onboardingSku.metrics.workflows_completed}/{onboardingSku.metrics.workflows_started} completed
                        {onboardingSku.metrics.completion_rate_percent != null
                          ? ` (${onboardingSku.metrics.completion_rate_percent}%)`
                          : ''}
                      </p>
                    )}
                    {onboardingSku.resolution_templates?.length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Resolution template:{' '}
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {onboardingSku.resolution_templates[0].name}
                        </span>
                      </p>
                    )}
                    {onboardingSku.install_command && (
                      <p className="text-[10px] font-mono text-gray-500 dark:text-gray-500 break-all">
                        {onboardingSku.install_command}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 pt-1">
                      {onboardingSku.template_id && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setOnboardingPanelOpen(false);
                            navigate('/workflows', { state: { startTemplateId: onboardingSku.template_id } });
                          }}
                        >
                          <Play className="w-4 h-4 mr-1.5" />
                          Run playbook
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setOnboardingPanelOpen(false);
                          navigate('/tickets');
                        }}
                      >
                        Create onboarding ticket
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setOnboardingPanelOpen((o) => !o)}
            className={cn(
              'fixed z-[54] flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation',
              onboardingPanelOpen
                ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 focus:ring-gray-500'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500'
            )}
            style={{
              bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
              right: 'max(1.5rem, env(safe-area-inset-right))',
            }}
            aria-label={onboardingPanelOpen ? 'Close onboarding playbook' : 'Open onboarding playbook'}
            title="Employee onboarding playbook"
          >
            {onboardingPanelOpen ? <X className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </button>
        </>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400 dark:text-green-600" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowTemplates;
