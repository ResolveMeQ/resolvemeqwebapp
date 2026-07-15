import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Hand,
  ShieldCheck,
  Bot,
  ShieldAlert,
  SkipForward,
  Lock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ConfirmModal from './ui/ConfirmModal';
import { api } from '../services/api';
import { cn } from '../utils/cn';

const STEP_TYPE_ICON = {
  manual: Hand,
  approval: ShieldCheck,
  auto_check: Bot,
  auto_action: ShieldAlert,
};

const STEP_TYPE_BADGE = {
  manual: 'secondary',
  approval: 'warning',
  auto_check: 'primary',
  auto_action: 'error',
};

const CONNECTOR_LABEL = {
  okta: 'Okta',
  google_workspace: 'Google Workspace',
  microsoft365: 'Microsoft 365',
};

const ACTION_LABEL = {
  deactivate_user: 'Deactivate user',
  reset_password: 'Reset password',
  remove_from_group: 'Remove from group',
  revoke_license: 'Revoke license',
};

const describeAutoAction = (cfg) => {
  if (!cfg) return '';
  const connector = CONNECTOR_LABEL[cfg.connector] || cfg.connector;
  const action = ACTION_LABEL[cfg.action] || cfg.action;
  return `${action} in ${connector}`;
};

const formatDue = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function StepStatusIcon({ step }) {
  if (step.status === 'done') {
    return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
  }
  if (step.status === 'skipped') {
    return <SkipForward className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
  }
  if (step.status === 'active') {
    return <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />;
  }
  return <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />;
};

function WorkflowProgressStepper({ steps }) {
  if (!steps?.length) return null;

  return (
    <div
      className="flex items-center w-full mb-4 overflow-x-auto"
      role="progressbar"
      aria-valuenow={steps.filter((s) => s.status === 'done').length}
      aria-valuemin={0}
      aria-valuemax={steps.length}
    >
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isSkipped = step.status === 'skipped';
        const isActive = step.status === 'active';
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center shrink-0" title={step.title}>
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 transition-colors',
                  isDone && 'bg-green-500 border-green-500',
                  isSkipped && 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600',
                  isActive && 'bg-primary-500 border-primary-500 ring-4 ring-primary-500/20',
                  !isDone && !isSkipped && !isActive && 'bg-transparent border-gray-300 dark:border-gray-600'
                )}
              />
              <span
                className={cn(
                  'mt-1 text-[10px] tabular-nums hidden sm:block max-w-[3rem] truncate text-center',
                  isActive ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {idx + 1}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 rounded-full min-w-[8px]',
                  isDone ? 'bg-green-500/70' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepAssistantPanel({ workflowId, step, disabled, onAccepted }) {
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.workflows.stepAssistant(workflowId, step.id);
      setData(res?.suggestions || null);
    } catch (e) {
      setError(e?.message || 'Could not load step guidance.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!data) return;
    const note = [
      data.summary,
      ...(data.actions || []).length ? ['', 'Actions:', ...(data.actions || []).map((a) => `- ${a}`)] : [],
    ].join('\n');
    setAccepting(true);
    setError(null);
    try {
      await api.workflows.acceptStepAssistant(workflowId, step.id, note);
      onAccepted?.();
    } catch (e) {
      setError(e?.message || 'Could not save guidance to ticket notes.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-primary-200 dark:border-primary-900/50 bg-primary-50/70 dark:bg-primary-950/20 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-800 dark:text-primary-200 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Step assistant
        </p>
        {!data && (
          <Button variant="outline" size="sm" type="button" loading={loading} disabled={disabled} onClick={loadSuggestions}>
            Get AI guidance
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {data && (
        <>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.summary}</p>
          {data.actions?.length > 0 && (
            <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc pl-4 space-y-0.5">
              {data.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          )}
          {data.kb_citations?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.kb_citations.map((kb) => (
                <Link
                  key={kb.kb_id || kb.title}
                  to={`/knowledge-base?kb=${encodeURIComponent(kb.kb_id)}`}
                  className="inline-flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <BookOpen className="w-3 h-3" />
                  {kb.title}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="secondary" size="sm" type="button" loading={accepting} disabled={disabled} onClick={handleAccept}>
              Add to ticket notes
            </Button>
            <Button variant="ghost" size="sm" type="button" disabled={loading || disabled} onClick={loadSuggestions}>
              Refresh
            </Button>
          </div>
          {data.source === 'fallback' && (
            <p className="text-[10px] text-amber-700 dark:text-amber-400">AI unavailable — showing linked playbook content.</p>
          )}
        </>
      )}
    </div>
  );
}

function StepDetailCard({ workflowId, step, busy, onClaim, onComplete, onAutoCheck, onRequestAutoAction, onAssistantAccepted }) {
  const isDone = step.status === 'done';
  const isSkipped = step.status === 'skipped';
  const isActive = step.status === 'active';
  const stepType = step.step_type || 'manual';
  const TypeIcon = STEP_TYPE_ICON[stepType] || Hand;
  const roleLabel = step.assignee_role_label || step.assignee_team;
  const checkResult = step.auto_check_result;
  const actionResult = step.auto_action_result;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        isActive
          ? 'border-2 border-primary-300 dark:border-primary-700 bg-primary-50/60 dark:bg-primary-950/30 shadow-sm'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30',
        (isDone || isSkipped) && 'opacity-80'
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <StepStatusIcon step={step} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isDone || isSkipped
              ? 'text-gray-500 dark:text-gray-500 line-through'
              : isActive
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-200'
          )}
        >
          {step.title}
        </p>
        {isSkipped && (
          <Badge variant="secondary" className="mt-1 text-[10px]">
            Skipped
          </Badge>
        )}
        {isDone && stepType === 'auto_check' && step.auto_verified && (
          <Badge variant="success" className="mt-1.5 text-[10px] gap-1">
            <Bot className="w-3 h-3" />
            Auto-verified
          </Badge>
        )}
        {stepType !== 'manual' && !isSkipped && !isDone && (
          <Badge variant={STEP_TYPE_BADGE[stepType] || 'secondary'} className="mt-1.5 text-[10px] gap-1">
            <TypeIcon className="w-3 h-3" />
            {stepType === 'approval'
              ? 'Approval'
              : stepType === 'auto_action'
                ? describeAutoAction(step.auto_action) || 'Directory action'
                : 'Auto check'}
          </Badge>
        )}
        {step.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{step.description}</p>
        )}
        {roleLabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{roleLabel}</p>
        )}
        {step.kb_articles?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {step.kb_articles.map((kb) => (
              <Link
                key={kb.kb_id}
                to={`/knowledge-base?kb=${encodeURIComponent(kb.kb_id)}`}
                className="inline-flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 hover:underline"
              >
                <BookOpen className="w-3 h-3" />
                {kb.title}
              </Link>
            ))}
          </div>
        )}
        {step.child_ticket?.ticket_id && (
          <Link
            to={`/tickets?highlight=${step.child_ticket.ticket_id}`}
            className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline"
          >
            Child ticket #{step.child_ticket.ticket_id}
            <span className="text-[10px] font-normal text-gray-500 capitalize">({step.child_ticket.status})</span>
          </Link>
        )}
        {step.due_at && !isDone && !isSkipped && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Due {formatDue(step.due_at)}
            </p>
            {step.is_overdue && (
              <Badge variant="error" className="text-[10px] px-1.5 py-0 gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </Badge>
            )}
          </div>
        )}
        {checkResult?.message && !isDone && !isSkipped && (
          <p
            className={cn(
              'text-xs mt-1.5',
              checkResult.status === 'success'
                ? 'text-green-600 dark:text-green-400'
                : checkResult.status === 'skipped'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            )}
          >
            {checkResult.message}
          </p>
        )}
        {actionResult?.message && !isDone && !isSkipped && (
          <p
            className={cn(
              'text-xs mt-1.5',
              actionResult.status === 'success'
                ? 'text-green-600 dark:text-green-400'
                : actionResult.status === 'skipped'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            )}
          >
            {actionResult.message}
          </p>
        )}
        {isActive && workflowId && (stepType === 'manual' || stepType === 'approval') && (
          <StepAssistantPanel
            workflowId={workflowId}
            step={step}
            disabled={busy}
            onAccepted={onAssistantAccepted}
          />
        )}
        {isDone && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {step.claimed_by ? `Completed by ${step.claimed_by.name}` : 'Completed automatically'}
          </p>
        )}
      </div>
      {isActive && (
        <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
          {stepType === 'auto_check' ? (
            <>
              <Button variant="primary" size="sm" loading={busy} onClick={() => onAutoCheck?.(step)}>
                Run check
              </Button>
              <Button variant="outline" size="sm" loading={busy} onClick={() => onComplete(step)}>
                Mark done
              </Button>
            </>
          ) : stepType === 'auto_action' ? (
            <>
              <Button variant="danger" size="sm" loading={busy} onClick={() => onRequestAutoAction?.(step)}>
                Execute action
              </Button>
              <Button variant="outline" size="sm" loading={busy} onClick={() => onComplete(step)}>
                Mark done
              </Button>
            </>
          ) : !step.claimed_by ? (
            step.can_claim === false ? (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                <Lock className="w-3.5 h-3.5" />
                {step.assignee_role_label || 'Restricted'}
              </span>
            ) : (
              <Button variant="primary" size="sm" loading={busy} onClick={() => onClaim(step)}>
                Claim
              </Button>
            )
          ) : (
            <Button variant="secondary" size="sm" loading={busy} onClick={() => onComplete(step)}>
              {step.step_type === 'approval' ? 'Approve' : 'Mark done'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ordered step checklist for a Workflow.
 * variant="embedded" — hide header (parent card already shows title/SLA/progress).
 * variant="standalone" — full header for ticket detail and other contexts.
 */
const WorkflowChecklist = ({ workflow, onUpdate, variant = 'standalone' }) => {
  const [busyStepId, setBusyStepId] = useState(null);
  const [error, setError] = useState(null);
  const [confirmingStep, setConfirmingStep] = useState(null);
  const [revealedSecret, setRevealedSecret] = useState(null);
  const embedded = variant === 'embedded';

  if (!workflow) return null;

  const handleClaim = async (step) => {
    if (step.can_claim === false) return;
    setBusyStepId(step.id);
    setError(null);
    try {
      await api.workflows.claimStep(workflow.id, step.id);
      onUpdate?.();
    } catch (e) {
      setError(e?.message || 'Could not claim this step.');
    } finally {
      setBusyStepId(null);
    }
  };

  const handleComplete = async (step) => {
    setBusyStepId(step.id);
    setError(null);
    try {
      await api.workflows.completeStep(workflow.id, step.id);
      onUpdate?.();
    } catch (e) {
      setError(e?.message || 'Could not mark this step done.');
    } finally {
      setBusyStepId(null);
    }
  };

  const handleAutoCheck = async (step) => {
    setBusyStepId(step.id);
    setError(null);
    try {
      const res = await api.workflows.rerunAutoCheck(workflow.id, step.id);
      if (!res?.passed) {
        setError(res?.message || 'Auto check did not pass.');
      }
      onUpdate?.();
    } catch (e) {
      setError(e?.message || 'Could not run auto check.');
    } finally {
      setBusyStepId(null);
    }
  };

  const handleExecuteAutoAction = async (step) => {
    setBusyStepId(step.id);
    setError(null);
    try {
      const res = await api.workflows.executeAutoAction(workflow.id, step.id);
      if (!res?.passed) {
        setError(res?.message || 'Action did not complete.');
      } else if (res?.generated_password) {
        setRevealedSecret({ stepId: step.id, title: step.title, password: res.generated_password });
      }
      onUpdate?.();
    } catch (e) {
      setError(e?.message || 'Could not execute this action.');
      throw e;
    } finally {
      setBusyStepId(null);
    }
  };

  const activeStep = workflow.steps.find((s) => s.status === 'active');

  return (
    <div>
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {workflow.template_name || 'Workflow'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {workflow.due_at && workflow.status === 'in_progress' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                SLA due {formatDue(workflow.due_at)}
              </span>
            )}
            {workflow.workflow_sla_breached && (
              <Badge variant="error" className="text-[10px] gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                SLA breached
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {workflow.steps_done}/{workflow.steps_total} done
            </span>
          </div>
        </div>
      )}

      {embedded && workflow.workflow_sla_breached && (
        <div className="mb-3">
          <Badge variant="error" className="text-[10px] gap-0.5">
            <AlertTriangle className="w-3 h-3" />
            Workflow SLA breached
          </Badge>
        </div>
      )}

      <WorkflowProgressStepper steps={workflow.steps} />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>
      )}

      {revealedSecret && (
        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-1">
            One-time temporary password
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">
            For "{revealedSecret.title}" — shown once, not stored. Share it with the user securely.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-800 rounded px-2 py-1">
              {revealedSecret.password}
            </code>
            <Button variant="ghost" size="sm" onClick={() => setRevealedSecret(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workflow.steps.map((step) => (
          <StepDetailCard
            key={step.id}
            workflowId={workflow.id}
            step={step}
            busy={busyStepId === step.id}
            onClaim={handleClaim}
            onComplete={handleComplete}
            onAutoCheck={handleAutoCheck}
            onRequestAutoAction={setConfirmingStep}
            onAssistantAccepted={onUpdate}
          />
        ))}
      </div>

      {!activeStep && workflow.status === 'completed' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          All steps complete
        </p>
      )}

      <ConfirmModal
        open={Boolean(confirmingStep)}
        onClose={() => setConfirmingStep(null)}
        title="Execute directory action?"
        description={
          confirmingStep
            ? `This will ${describeAutoAction(confirmingStep.auto_action).toLowerCase() || 'run this action'} for "${confirmingStep.title}" right now. This cannot be undone automatically.`
            : ''
        }
        confirmLabel="Execute"
        variant="danger"
        onConfirm={() => handleExecuteAutoAction(confirmingStep)}
      />
    </div>
  );
};

export default WorkflowChecklist;
