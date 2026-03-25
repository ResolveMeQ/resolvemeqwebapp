import React from 'react';
import { cn } from '../../utils/cn';

/** Lightweight inline SVGs for empty / error / quota — no external assets. */

const svgWrap = 'mx-auto w-full max-w-[200px] h-auto';

export function IllustrationChatLoading({ className }) {
  return (
    <svg viewBox="0 0 160 120" className={cn(svgWrap, className)} aria-hidden="true">
      <defs>
        <linearGradient id="chatLoadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="[stop-color:theme(colors.primary.300)] dark:[stop-color:theme(colors.primary.700)]" />
          <stop offset="100%" className="[stop-color:theme(colors.primary.500)] dark:[stop-color:theme(colors.primary.500)]" />
        </linearGradient>
      </defs>
      <rect x="24" y="28" width="112" height="64" rx="12" fill="url(#chatLoadGrad)" opacity="0.35" />
      <rect x="36" y="40" width="72" height="8" rx="4" className="fill-gray-300/80 dark:fill-gray-600/80" />
      <rect x="36" y="54" width="56" height="8" rx="4" className="fill-gray-200/90 dark:fill-gray-700/50" />
      <circle cx="130" cy="36" r="14" className="fill-primary-400/40 dark:fill-primary-500/30" />
      <path
        d="M124 36h12M130 30v12"
        stroke="currentColor"
        className="text-primary-600 dark:text-primary-400"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationChatWelcome({ className }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('mx-auto w-full max-w-[180px] h-auto', className)} aria-hidden="true">
      <rect
        x="20"
        y="32"
        width="80"
        height="56"
        rx="10"
        className="fill-primary-100/80 dark:fill-primary-900/40 stroke-primary-300/40 dark:stroke-primary-700/50"
        strokeWidth="1.5"
      />
      <rect x="52" y="48" width="88" height="48" rx="10" className="fill-white dark:fill-gray-800 stroke-primary-200 dark:stroke-primary-700" strokeWidth="1.5" />
      <circle cx="72" cy="64" r="4" className="fill-primary-400" />
      <circle cx="88" cy="64" r="4" className="fill-primary-300/50" />
      <circle cx="104" cy="64" r="4" className="fill-primary-300/50" />
    </svg>
  );
}

export function IllustrationChatError({ className }) {
  return (
    <svg viewBox="0 0 120 96" className={cn('mx-auto w-full max-w-[140px] h-auto shrink-0', className)} aria-hidden="true">
      <path
        d="M60 12L108 84H12L60 12z"
        className="fill-amber-100/90 dark:fill-amber-950/50 stroke-amber-400/80 dark:stroke-amber-700"
        strokeWidth="1.5"
      />
      <path
        d="M60 40v28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-amber-800 dark:text-amber-200"
      />
      <circle cx="60" cy="78" r="2.5" className="fill-amber-800 dark:fill-amber-200" />
    </svg>
  );
}

export function IllustrationQuota({ className }) {
  return (
    <svg viewBox="0 0 120 96" className={cn('mx-auto w-full max-w-[120px] h-auto shrink-0', className)} aria-hidden="true">
      <rect
        x="16"
        y="20"
        width="88"
        height="56"
        rx="8"
        className="fill-red-50 dark:fill-red-950/40 stroke-red-200 dark:stroke-red-900/60"
        strokeWidth="1.5"
      />
      <rect x="28" y="36" width="64" height="8" rx="2" className="fill-red-200/60 dark:fill-red-900/30" />
      <rect x="28" y="50" width="48" height="8" rx="2" className="fill-red-200/40 dark:fill-red-900/20" />
      <circle cx="88" cy="64" r="18" className="fill-red-100 dark:fill-red-900/50 stroke-red-400/60 dark:stroke-red-700" strokeWidth="2" />
      <path d="M88 56v16M80 64h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-600 dark:text-red-400" />
    </svg>
  );
}

export function IllustrationTicketsEmpty({ className }) {
  return (
    <svg viewBox="0 0 160 120" className={cn(svgWrap, className)} aria-hidden="true">
      <rect
        x="20"
        y="24"
        width="120"
        height="72"
        rx="10"
        className="fill-gray-100 dark:fill-gray-800/80 stroke-gray-200 dark:stroke-gray-700"
        strokeWidth="1.5"
      />
      <rect x="32" y="40" width="72" height="6" rx="3" className="fill-gray-300/80 dark:fill-gray-600/50" />
      <rect x="32" y="52" width="96" height="6" rx="3" className="fill-gray-200/90 dark:fill-gray-700/40" />
      <rect x="32" y="64" width="40" height="6" rx="3" className="fill-primary-200/80 dark:fill-primary-900/40" />
      <circle cx="130" cy="36" r="14" className="fill-primary-100 dark:fill-primary-900/40" />
      <path d="M124 36h12M130 30v12" stroke="currentColor" strokeWidth="2" className="text-primary-500 dark:text-primary-400" strokeLinecap="round" />
    </svg>
  );
}

export function IllustrationTicketsError({ className }) {
  return (
    <svg viewBox="0 0 120 96" className={cn('mx-auto w-full max-w-[160px] h-auto', className)} aria-hidden="true">
      <circle cx="60" cy="48" r="36" className="fill-red-50 dark:fill-red-950/40 stroke-red-200 dark:stroke-red-900/60" strokeWidth="2" />
      <path d="M48 48l24 24M72 48L48 72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-500 dark:text-red-400" />
    </svg>
  );
}
