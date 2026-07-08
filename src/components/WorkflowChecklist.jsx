import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, AlertTriangle, Hand, ShieldCheck, Bot } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { api } from '../services/api';

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

/**
 * Ordered step checklist for a Workflow -- reused on the ticket detail page and the
 * standalone Workflows list. Strictly sequential: only the `active` step is actionable,
 * done steps show who completed them, pending steps are visible but greyed out.
 */
const WorkflowChecklist = ({ workflow, onUpdate }) => {
  const [busyStepId, setBusyStepId] = useState(null);
  const [error, setError] = useState(null);

  if (!workflow) return null;

  const handleClaim = async (step) => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {workflow.template_name || 'Workflow'}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {workflow.steps_done}/{workflow.steps_total} done
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>
      )}

      <div className="space-y-2">
        {workflow.steps.map((step) => {
          const isDone = step.status === 'done';
          const isActive = step.status === 'active';
          const isBusy = busyStepId === step.id;
          const stepType = step.step_type || 'manual';
          const TypeIcon = STEP_TYPE_ICON[stepType] || Hand;

          return (
            <div
              key={step.id}
              className={
                'flex items-start gap-3 p-3 rounded-lg border ' +
                (isActive
                  ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30')
              }
            >
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : isActive ? (
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={
                    'text-sm font-medium ' +
                    (isDone
                      ? 'text-gray-500 dark:text-gray-500 line-through'
                      : 'text-gray-900 dark:text-gray-100')
                  }
                >
                  {step.title}
                </p>
                {stepType !== 'manual' && (
                  <Badge variant={STEP_TYPE_BADGE[stepType] || 'secondary'} className="mt-1.5 text-[10px] gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {stepType === 'approval' ? 'Approval' : 'Auto check'}
                  </Badge>
                )}
                {step.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                )}
                {step.assignee_team && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{step.assignee_team}</p>
                )}
                {step.due_at && !isDone && (
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
                    <Button variant="primary" size="sm" loading={isBusy} onClick={() => handleClaim(step)}>
                      Claim
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" loading={isBusy} onClick={() => handleComplete(step)}>
                      {step.step_type === 'approval' ? 'Approve' : 'Mark done'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowChecklist;
