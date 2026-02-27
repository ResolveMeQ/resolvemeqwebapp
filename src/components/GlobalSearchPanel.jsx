import React from 'react';
import { Search, FileText, Users as UsersIcon, Ticket } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

const GlobalSearchPanel = ({
  query,
  results,
  loading,
  error,
  onNavigate,
}) => {
  if (!query) return null;

  const hasAnyResults =
    (results?.tickets && results.tickets.length > 0) ||
    (results?.knowledgeBase && results.knowledgeBase.length > 0) ||
    (results?.users && results.users.length > 0);

  return (
    <div className="px-6 pt-4 pb-2">
      <Card className="p-4 border border-blue-100 dark:border-blue-900/40 bg-white/90 dark:bg-gray-900/90 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Global search for <span className="font-semibold">“{query}”</span>
            </p>
          </div>
          {loading && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Searching…</span>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
            {error}
          </div>
        )}

        {!loading && !error && !hasAnyResults && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No matches found in tickets, knowledge base, or team members.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {/* Tickets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Tickets
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('tickets')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-1.5">
              {(results?.tickets || []).slice(0, 5).map((t) => {
                const id = t.ticket_id ?? t.id;
                const title = t.issue_type || t.description || 'Untitled ticket';
                const status = (t.status || '').toLowerCase();
                return (
                  <div
                    key={id}
                    className="rounded-md px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => onNavigate?.('tickets')}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        #{id} · {title}
                      </p>
                      {t.category && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {t.category}
                        </p>
                      )}
                    </div>
                    {status && (
                      <Badge
                        variant={
                          status === 'resolved'
                            ? 'success'
                            : status === 'escalated'
                            ? 'error'
                            : 'warning'
                        }
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {status}
                      </Badge>
                    )}
                  </div>
                );
              })}
              {!loading && (results?.tickets || []).length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No tickets match this search.
                </p>
              )}
            </div>
          </div>

          {/* Knowledge Base */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Knowledge Base
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('knowledge-base')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open KB
              </button>
            </div>
            <div className="space-y-1.5">
              {(results?.knowledgeBase || []).slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="rounded-md px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => onNavigate?.('knowledge-base')}
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {a.title}
                  </p>
                  {a.category && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {a.category}
                    </p>
                  )}
                </div>
              ))}
              {!loading && (results?.knowledgeBase || []).length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No articles match this search.
                </p>
              )}
            </div>
          </div>

          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Team members
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('users')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-1.5">
              {(results?.users || []).slice(0, 5).map((u) => {
                const fullName =
                  u.full_name ||
                  `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                  u.email ||
                  u.username ||
                  'Member';
                return (
                  <div
                    key={u.id}
                    className="rounded-md px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => onNavigate?.('users')}
                  >
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {fullName}
                    </p>
                    {u.email && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {u.email}
                      </p>
                    )}
                  </div>
                );
              })}
              {!loading && (results?.users || []).length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No team members match this search.
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GlobalSearchPanel;

