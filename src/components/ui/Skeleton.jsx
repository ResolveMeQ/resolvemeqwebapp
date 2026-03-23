import React from 'react';
import { cn } from '../../utils/cn';
import Card from './Card';

/**
 * Base pulse block for loading placeholders.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        'animate-pulse rounded-md bg-gray-200/90 dark:bg-gray-700/70',
        className
      )}
      {...props}
    />
  );
}

const TABLE_ROWS = 8;
const MOBILE_ROWS = 6;

export function TicketsPageSkeleton() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <Skeleton className="h-8 w-36 sm:w-44 max-w-full mb-2" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[140px] rounded-lg shrink-0" />
      </header>

      <Card className="overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-full sm:w-56 rounded-lg" />
        </div>

        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
          {Array.from({ length: MOBILE_ROWS }).map((_, i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-full max-w-[220px]" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-6 w-[4.5rem] rounded-full shrink-0" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="text-left px-6 py-3">
                    <Skeleton className="h-3 w-12" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {Array.from({ length: TABLE_ROWS }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-52 max-w-[min(280px,40vw)]" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-[4.5rem] rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 border-2 border-primary-200 dark:border-primary-900/50 bg-gradient-to-br from-primary-50/80 to-white dark:from-primary-950/30 dark:to-gray-950">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-11 w-64 max-w-full rounded-lg" />
          </div>
          <Skeleton className="hidden md:block h-16 w-16 rounded-xl shrink-0" />
        </div>
      </Card>

      <header>
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3 min-w-0 flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-14" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <AIRecommendationsPanelSkeleton />

      <Card className="p-6 border-l-4 border-l-amber-500/40 dark:border-l-amber-600/40">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-full max-w-md mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[3.25rem] w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AIRecommendationsPanelSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <div className="p-6 space-y-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6 space-y-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border border-dashed border-gray-300 dark:border-gray-600">
            <div className="p-6 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[80%]" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export function TicketDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-[8.5rem] rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Article grid only — Knowledge Base keeps header + toolbar visible. */
export function KnowledgeBaseArticlesSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <Skeleton className="h-5 w-[88%]" />
            <Skeleton className="h-4 w-4 rounded shrink-0" />
          </div>
          <div className="space-y-2 mb-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[80%]" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TeamsPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-56 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-[75%] max-w-[200px]" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-4 w-28 mt-3" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[90%]" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BillingPageSkeleton() {
  return (
    <div className="space-y-6">
      <header>
        <Skeleton className="h-8 w-56 max-w-full mb-2" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-48 max-w-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      </Card>
      <div className="flex justify-center">
        <Skeleton className="h-10 w-[220px] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="text-center mb-6 space-y-3">
              <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
              <Skeleton className="h-6 w-28 mx-auto" />
              <Skeleton className="h-4 w-full max-w-[200px] mx-auto" />
              <Skeleton className="h-10 w-24 mx-auto" />
            </div>
            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </Card>
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <Skeleton className="h-10 w-36 sm:w-40" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>

      <Card className="p-4">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-3 w-full max-w-xl mb-4" />
        <div className="flex flex-wrap items-end gap-3">
          <Skeleton className="h-[3.25rem] w-44 rounded-lg" />
          <Skeleton className="h-[3.25rem] w-56 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Skeleton className="h-9 flex-1 min-w-[200px] max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-[140px] rounded-lg" />
        <Skeleton className="h-9 w-[120px] rounded-lg" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="text-left py-3 px-4">
                    <Skeleton className="h-3 w-12" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <Skeleton className="h-4 w-32 max-w-[12rem]" />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-44 max-w-full" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="py-3 px-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <Card>
        <div className="p-4 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Skeleton;
