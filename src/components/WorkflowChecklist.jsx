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
  SkipForward,
  Lock,
  BookOpen,
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { api } from '../services/api';
import { cn } from '../utils/cn';

const STEP_TYPE_ICON = {
  manual: Hand,
  approval: ShieldCheck,
  auto_check: Bot,
};

const STEP_TYPE_BADGE = {
  manual: 'secondary',
  approval: 'warning',
  auto_check: 'primary',
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
      className="flex items-center w-full mb-4"
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

function StepDetailCard({ step, busy, onClaim, onComplete }) {
  const isDone = step.status === 'done';
  const isSkipped = step.status === 'skipped';
  const isActive = step.status === 'active';
  const stepType = step.step_type || 'manual';
  const TypeIcon = STEP_TYPE_ICON[stepType] || Hand;
  const roleLabel = step.assignee_role_label || step.assignee_team;

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
        {stepType !== 'manual' && !isSkipped && (
          <Badge variant={STEP_TYPE_BADGE[stepType] || 'secondary'} className="mt-1.5 text-[10px] gap-1">
            <TypeIcon className="w-3 h-3" />
            {stepType === 'approval' ? 'Approval' : 'Auto check'}
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
        {isDone && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {step.claimed_by ? `Completed by ${step.claimed_by.name}` : 'Completed automatically'}
          </p>
        )}
      </div>
      {isActive && (
        <div className="flex-shrink-0">
          {!step.claimed_by ? (
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

      <div className="space-y-2">
        {workflow.steps.map((step) => (
          <StepDetailCard
            key={step.id}
            step={step}
            busy={busyStepId === step.id}
            onClaim={handleClaim}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {!activeStep && workflow.status === 'completed' && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          All steps complete
        </p>
      )}
    </div>
  );
};

export default WorkflowChecklist;
