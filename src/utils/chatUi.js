/**
 * Chat UI helpers: agent returns dynamic suggested_actions + quick_replies (see resolvemeq-agent).
 */

/** Normalize suggested_actions from API (objects with intent) or legacy strings. */
export function normalizeSuggestedActionsList(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw
    .map((item) => {
      if (item && typeof item === 'object' && item.label) {
        const intent = item.intent || 'compose';
        const allowed = ['auto_resolve', 'escalate', 'request_clarification', 'compose'];
        return {
          label: String(item.label),
          intent: allowed.includes(intent) ? intent : 'compose',
          message:
            item.message != null && String(item.message).trim()
              ? String(item.message).trim()
              : null,
        };
      }
      if (typeof item === 'string' && item.trim()) {
        const s = item.trim();
        const low = s.toLowerCase();
        if (low.includes('escalat')) return { label: s, intent: 'escalate', message: null };
        if (low.includes('resolv') || low.includes('mark')) return { label: s, intent: 'auto_resolve', message: null };
        return { label: s, intent: 'compose', message: s };
      }
      return null;
    })
    .filter(Boolean);
}

/** First-turn injection from stored ticket.agent_response (includes AI-generated UI when present). */
export function suggestedActionsFromAgentResponse(ar) {
  const fromAi = normalizeSuggestedActionsList(ar?.suggested_actions);
  if (fromAi.length > 0) return fromAi;
  const ra = String(ar?.recommended_action || '').toLowerCase();
  const out = [];
  if (ra.includes('auto_resolve')) {
    out.push({ label: 'Mark as resolved', intent: 'auto_resolve', message: null });
  } else if (ra.includes('escalate')) {
    out.push({ label: 'Escalate to support', intent: 'escalate', message: null });
  } else if (ra.includes('clarif')) {
    out.push({ label: 'Provide more details', intent: 'request_clarification', message: null });
  }
  return out;
}

export function quickRepliesFromAgentResponse(ar) {
  const qr = ar?.quick_replies;
  if (Array.isArray(qr) && qr.length > 0) {
    const cleaned = qr.filter((x) => x && x.label && x.value);
    if (cleaned.length > 0) return cleaned;
  }
  return [{ label: 'Talk to a human', value: 'I need to speak with support staff' }];
}
