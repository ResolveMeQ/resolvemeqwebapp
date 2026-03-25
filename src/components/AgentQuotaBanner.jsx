import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

/**
 * Warns when monthly AI agent usage crosses 80% / 90% of plan limit (from /api/billing/usage/).
 */
const AgentQuotaBanner = ({ user }) => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!user) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const u = await api.billing.getUsage();
        if (cancelled) return;
        if (u.agent_operations_unlimited) {
          setInfo(null);
          return;
        }
        const lim = u.agent_operations_limit;
        const used = u.agent_operations_used;
        if (lim == null || lim <= 0 || used == null) {
          setInfo(null);
          return;
        }
        const ratio = used / lim;
        if (ratio >= 0.9) {
          setInfo({ level: 'critical', used, lim, ends: u.agent_period_ends_at });
        } else if (ratio >= 0.8) {
          setInfo({ level: 'warn', used, lim, ends: u.agent_period_ends_at });
        } else {
          setInfo(null);
        }
      } catch {
        if (!cancelled) setInfo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!info) return null;

  const isCritical = info.level === 'critical';
  const barClass = isCritical
    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-100'
    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-100';

  return (
    <div
      className={`mx-4 sm:mx-6 mt-3 rounded-lg border px-4 py-3 flex flex-wrap items-start gap-3 ${barClass}`}
      role="status"
    >
      <AlertTriangle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}
        aria-hidden
      />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-medium">
          {isCritical
            ? 'You are at or over 90% of your monthly AI agent usage.'
            : 'You have used at least 80% of your monthly AI agent allowance.'}
        </p>
        <p className="mt-1 opacity-90">
          {info.used} / {info.lim} agent operations this period
          {info.ends ? (
            <>
              {' '}
              · Resets {new Date(info.ends).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </>
          ) : null}
        </p>
        <Link
          to="/billing"
          className={`inline-block mt-2 font-medium underline underline-offset-2 ${
            isCritical ? 'text-red-800 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'
          }`}
        >
          Review usage and upgrade your plan
        </Link>
      </div>
    </div>
  );
};

export default AgentQuotaBanner;
