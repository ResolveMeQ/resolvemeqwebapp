/** Relative-hours ETA text from an ISO due date, e.g. "within about 6 hours". */
function formatEta(slaIso) {
  if (!slaIso) return null;
  const hours = (new Date(slaIso).getTime() - Date.now()) / 3600000;
  if (hours <= 0) return 'shortly';
  return `within about ${Math.max(1, Math.round(hours))} hours`;
}

/**
 * Single-line “next step” copy for ticket detail (above the fold).
 */
export function getTicketNextStep(ticket) {
  if (!ticket) return null;
  const s = (ticket.status || '').toLowerCase();

  if (s === 'resolved') {
    return {
      title: 'Next step',
      body: 'Confirm whether the fix worked (feedback below). If something is still wrong, use AI Chat or reopen the ticket.',
      tone: 'success',
    };
  }
  if (s === 'escalated') {
    if (ticket.claimed_at) {
      return {
        title: 'Being worked on',
        body: `${ticket.assigned_to_name || 'A support specialist'} is now looking into this.`,
        tone: 'info',
      };
    }
    const eta = formatEta(ticket.sla_due_at);
    return {
      title: 'In review',
      body: eta
        ? `A support specialist will review this, typically ${eta}. You can add more details below while you wait — it helps us move faster.`
        : 'A support specialist will review this. You can add more details below while you wait — it helps us move faster.',
      tone: 'warning',
    };
  }
  if (s === 'pending_clarification') {
    return {
      title: 'Next step',
      body: 'Reply in AI chat with the details we asked for so we can continue.',
      tone: 'info',
    };
  }
  if (s === 'in_progress' || s === 'in-progress') {
    return {
      title: 'Next step',
      body: 'Try the steps in AI chat. If you’re stuck, add a comment or escalate to a human.',
      tone: 'info',
    };
  }
  if (s === 'new' || s === 'open') {
    return {
      title: 'Next step',
      body: 'Open AI chat to get suggested steps or describe what you’ve already tried.',
      tone: 'info',
    };
  }
  return {
    title: 'Next step',
    body: 'Use AI chat for guided steps, or update this ticket with new information.',
    tone: 'neutral',
  };
}
