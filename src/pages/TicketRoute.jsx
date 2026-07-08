import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Thin redirect: hands a ticket id off to Tickets.jsx's existing
 * `location.state.openTicketId` handling (already used for notification links),
 * so a direct/bookmarked `/tickets/:id` URL opens that ticket instead of
 * falling through to the wildcard route.
 */
export default function TicketRoute() {
  const { id } = useParams();
  const ticketId = Number(id);
  const state = Number.isFinite(ticketId) ? { openTicketId: ticketId } : undefined;
  return <Navigate to="/tickets" state={state} replace />;
}
