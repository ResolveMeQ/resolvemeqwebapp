import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronDown, Users } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Workspace (team) switcher — shown in header and sidebar.
 */
const WorkspaceSwitcher = ({
  activeTeamId,
  activeTeamName,
  userTeams = [],
  onActiveTeamChange,
  variant = 'sidebar',
  collapsed = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const hasTeams = userTeams.length > 0;
  const label = activeTeamName || (hasTeams ? 'Select workspace' : 'No workspace');
  const isCompact = variant === 'header';

  if (!hasTeams && !activeTeamId) {
    if (isCompact) {
      return (
        <Link
          to="/teams"
          data-tour="team-switcher"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950/50 shrink-0"
          title="Create your workspace on the Teams page"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Set up workspace</span>
          <span className="sm:hidden">Workspace</span>
        </Link>
      );
    }

    if (collapsed) {
      return (
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <Link
            to="/teams"
            title="Create workspace"
            data-tour="team-switcher"
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-amber-700 dark:text-amber-300"
          >
            <Building2 size={18} />
          </Link>
        </div>
      );
    }

    return (
      <div
        data-tour="team-switcher"
        className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0"
      >
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100">No workspace yet</p>
              <p className="mt-1 text-[11px] leading-snug text-amber-800/90 dark:text-amber-100/80">
                Create one on Teams to scope tickets, KB, and integrations.
              </p>
              <Link
                to="/teams"
                className="mt-2 inline-block text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline"
              >
                Create workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-tour="team-switcher"
      className={cn(
        'relative shrink-0',
        isCompact ? '' : 'px-3 py-3 border-t border-gray-200 dark:border-gray-800'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg transition-colors text-left',
          isCompact
            ? 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 max-w-[11rem] sm:max-w-[14rem]'
            : cn(
                'w-full justify-between px-3 py-2',
                'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )
        )}
        title={collapsed ? label : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className={cn('shrink-0 text-gray-500 dark:text-gray-400', isCompact ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]')} />
          {(!collapsed || isCompact) && (
            <span className="truncate text-sm font-medium">{label}</span>
          )}
        </div>
        {(!collapsed || isCompact) && (
          <ChevronDown className={cn('shrink-0 text-gray-400', isCompact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5')} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              'absolute z-50 py-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 max-h-48 overflow-y-auto min-w-[12rem]',
              isCompact ? 'right-0 top-full mt-1' : collapsed ? 'left-full ml-2 top-0' : 'left-0 right-0 bottom-full mb-2'
            )}
          >
            <button
              type="button"
              onClick={() => {
                onActiveTeamChange?.(null);
                setOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                !activeTeamId
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              No workspace selected
            </button>
            {userTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onActiveTeamChange?.(t.id);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm truncate transition-colors',
                  activeTeamId === t.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {t.name}
              </button>
            ))}
            {!hasTeams && (
              <Link
                to="/teams"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-primary-700 dark:text-primary-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Create workspace…
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSwitcher;
