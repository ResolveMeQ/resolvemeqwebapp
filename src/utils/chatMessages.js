import {
  normalizeSuggestedActionsList,
  suggestedActionsFromAgentResponse,
  quickRepliesFromAgentResponse,
} from './chatUi';

const PROSE_RESPONSE_STYLES = new Set(['informational', 'clarification_only', 'escalation_focus']);

/** Map a persisted API chat message to the shape used by AIChatPanel. */
export function mapChatMessageFromApi(msg, { hideFeedbackPrompt = false } = {}) {
  const meta = msg.metadata || {};
  const wh = msg.was_helpful;
  const senderType = msg.sender_type || msg.type;
  const suppressPrompt = hideFeedbackPrompt || msg.show_feedback_prompt === false || wh != null;
  return {
    id: msg.id,
    type: senderType,
    text: msg.text,
    confidence: msg.confidence,
    authorName: msg.author_name,
    metadata: {
      ...meta,
      suggested_actions: normalizeSuggestedActionsList(meta.suggested_actions),
    },
    messageType: msg.message_type,
    wasHelpful: wh,
    showFeedbackPrompt: suppressPrompt ? false : senderType === 'ai',
    createdAt: msg.created_at,
  };
}

/** Build synthetic first-turn messages from ticket.agent_response when nothing is persisted yet. */
export function buildSyntheticMessagesFromAgentResponse(ticketData, initialRated = null) {
  const ar = ticketData?.agent_response;
  if (!ticketData?.agent_processed || !ar || typeof ar !== 'object') return null;
  const stableTicketId = ticketData?.id ?? ticketData?.ticket_id ?? 'unknown';
  const solution = ar.solution || {};
  const responseStyle = ar.response_style || 'guided_steps';
  const steps = solution.steps || solution.immediate_actions || [];
  const confidence = ar.confidence ?? 0.5;
  const reasoning = ar.reasoning || '';
  let aiText = '';
  if (PROSE_RESPONSE_STYLES.has(responseStyle)) {
    aiText = reasoning || (Array.isArray(steps) && steps[0]) || '';
  } else if (Array.isArray(steps) && steps.length > 0) {
    if (steps.length === 1) {
      aiText = steps[0];
    } else if (steps.length <= 3) {
      aiText = "Here's what I suggest:\n\n" + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    } else {
      aiText = "Here are the first steps to try:\n\n" + steps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n');
      aiText += `\n\nThere are ${steps.length - 3} more steps. Would you like to see them?`;
    }
  } else {
    aiText = reasoning || "I've analyzed your issue and I'm here to help. Can you provide more details?";
  }
  const userText = ticketData.description || ticketData.issue_type || 'My issue';
  return [
    { id: `injected-user-${stableTicketId}`, type: 'user', text: userText, createdAt: new Date().toISOString() },
    {
      id: `injected-ai-${stableTicketId}`,
      type: 'ai',
      text: aiText,
      confidence,
      metadata: {
        response_style: responseStyle,
        steps: PROSE_RESPONSE_STYLES.has(responseStyle) ? [] : (Array.isArray(steps) ? steps : []),
        suggested_actions: suggestedActionsFromAgentResponse(ar),
        estimated_time: PROSE_RESPONSE_STYLES.has(responseStyle) ? undefined : solution.estimated_time,
        success_probability: PROSE_RESPONSE_STYLES.has(responseStyle) ? undefined : solution.success_probability,
        quick_replies: quickRepliesFromAgentResponse(ar),
      },
      messageType: PROSE_RESPONSE_STYLES.has(responseStyle) ? 'text' : steps.length > 1 ? 'steps' : 'text',
      wasHelpful: initialRated != null ? initialRated : null,
      showFeedbackPrompt: initialRated == null,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function isEphemeralChatMessage(message) {
  const id = String(message?.id || '');
  return message?.type === 'system' || id.startsWith('welcome-') || id.startsWith('resolution-');
}

/** Merge server history with any client-only bubbles (welcome, system prompts, etc.). */
export function mergeServerChatMessages(clientMessages, serverMsgList, { hideFeedbackPrompt = false } = {}) {
  const serverMapped = (serverMsgList || []).map((msg) => mapChatMessageFromApi(msg, { hideFeedbackPrompt }));
  if (!serverMapped.length) return clientMessages;

  const ephemeral = (clientMessages || []).filter(isEphemeralChatMessage);
  return [...serverMapped, ...ephemeral].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );
}

/**
 * Build the initial message list for AI chat.
 * Keeps synthetic first-turn context when the server only has a human reply so far.
 */
export function buildInitialChatMessages(serverMsgList, ticketData, initialRated = null) {
  const serverMapped = (serverMsgList || []).map((msg) => mapChatMessageFromApi(msg));
  if (serverMapped.length > 0) {
    const hasUserOrAi = serverMapped.some((m) => m.type === 'user' || m.type === 'ai');
    if (!hasUserOrAi && ticketData) {
      const synthetic = buildSyntheticMessagesFromAgentResponse(ticketData, initialRated);
      if (synthetic?.length) {
        return [...synthetic, ...serverMapped];
      }
    }
    return serverMapped;
  }
  return buildSyntheticMessagesFromAgentResponse(ticketData, initialRated) || [];
}

export function extractHistoryMessageList(data) {
  const conv = data?.conversation || data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(conv?.messages)) return conv.messages;
  return [];
}
