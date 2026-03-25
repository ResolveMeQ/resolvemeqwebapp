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
    return {
      title: 'Next step',
      body: 'Support will review your ticket. You’ll get updates in the app and by email when there’s progress.',
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
