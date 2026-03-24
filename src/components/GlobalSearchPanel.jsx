import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users as UsersIcon, Ticket, Lightbulb, X } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

const GlobalSearchPanel = ({
  query,
  results,
  loading,
  error,
  onNavigate,
  onClose,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [query, onClose]);

  if (!query) return null;

  const openKnowledgeBaseWithQuery = () => {
    const q = (query || '').trim();
    if (q) {
      navigate(`/knowledge-base?q=${encodeURIComponent(q)}`);
    } else {
      onNavigate?.('knowledge-base');
    }
    onClose?.();
  };

  /** Prefer a specific phrase (e.g. similar-resolved title) over the global search box. */
  const openKnowledgeBaseWithHint = (hint) => {
    const q = (hint || query || '').trim();
    if (q) {
      navigate(`/knowledge-base?q=${encodeURIComponent(q)}`);
    } else {
      onNavigate?.('knowledge-base');
    }
    onClose?.();
  };

  const openYourTicket = (ticketId) => {
    const n = Number(ticketId);
    if (Number.isNaN(n)) return;
    navigate('/tickets', { state: { openTicketId: n } });
    onClose?.();
  };

  const openKbArticle = (article) => {
    const kbId = article?.kb_id ?? article?.id;
    if (kbId == null) {
      openKnowledgeBaseWithQuery();
      return;
    }
    const q = (query || '').trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('kb', String(kbId));
    navigate(`/knowledge-base?${params.toString()}`);
    onClose?.();
  };

  const hasAnyResults =
    (results?.tickets && results.tickets.length > 0) ||
    (results?.communityResolvedTickets && results.communityResolvedTickets.length > 0) ||
    (results?.knowledgeBase && results.knowledgeBase.length > 0) ||
    (results?.users && results.users.length > 0);

  return (
    <div data-global-search-panel className="-mx-4 px-4 sm:mx-0 sm:px-6 pt-4 pb-2 max-w-[100vw] sm:max-w-none">
      <Card className="p-4 border border-blue-100 dark:border-blue-900/40 bg-white/90 dark:bg-gray-900/90 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
              Global search for <span className="font-semibold">“{query}”</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {loading && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Searching…</span>
            )}
            <button
              type="button"
              onClick={() => onClose?.()}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close search results"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {/* Tickets: yours + community resolved hints */}
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
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Yours
                </p>
                <div className="space-y-1.5">
                  {(results?.tickets || []).slice(0, 5).map((t) => {
                    const id = t.ticket_id ?? t.id;
                    const title = t.issue_type || t.description || 'Untitled ticket';
                    const status = (t.status || '').toLowerCase();
                    return (
                      <div
                        key={id}
                        role="button"
                        tabIndex={0}
                        className="rounded-md px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => openYourTicket(id)}
                        onKeyDown={(e) => e.key === 'Enter' && openYourTicket(id)}
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
                            {status === 'pending_clarification'
                              ? 'Pending clarification'
                              : status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  {!loading && (results?.tickets || []).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">None of yours match.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Similar resolved (others)
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 leading-snug">
                  How others fixed similar issues — click a row to search the knowledge base with that topic (other people&apos;s tickets stay private).
                </p>
                <div className="space-y-1.5">
                  {(results?.communityResolvedTickets || []).slice(0, 5).map((h) => {
                    const id = h.ticket_id;
                    const title = h.issue_type || h.description_preview || 'Resolved example';
                    return (
                      <div
                        key={`c-${id}`}
                        role="button"
                        tabIndex={0}
                        className="rounded-md px-2.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/35"
                        onClick={() =>
                          openKnowledgeBaseWithHint(
                            h.issue_type || h.description_preview || query
                          )
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          openKnowledgeBaseWithHint(
                            h.issue_type || h.description_preview || query
                          )
                        }
                        title="Search knowledge base for this topic"
                      >
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                          {title}
                        </p>
                        {h.category && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{h.category}</p>
                        )}
                        {h.solution_preview && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {h.solution_preview}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {!loading && (results?.communityResolvedTickets || []).length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {query.trim().length < 2
                        ? 'Type at least 2 characters to search resolved examples.'
                        : 'No similar resolved tickets found.'}
                    </p>
                  )}
                </div>
              </div>
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
                onClick={openKnowledgeBaseWithQuery}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open KB
              </button>
            </div>
            <div className="space-y-1.5">
              {(results?.knowledgeBase || []).slice(0, 5).map((a) => (
                <div
                  key={a.kb_id ?? a.id}
                  role="button"
                  tabIndex={0}
                  className="rounded-md px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => openKbArticle(a)}
                  onKeyDown={(e) => e.key === 'Enter' && openKbArticle(a)}
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

