import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';

function parseQuestionId(slugAndId) {
  const value = String(slugAndId || '').trim();
  const match = value.match(/-(\d+)$/);
  if (match) return Number(match[1]);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export default function CommunityQuestionPublic() {
  const { slugAndId } = useParams();
  const questionId = useMemo(() => parseQuestionId(slugAndId), [slugAndId]);
  const to = questionId
    ? `/knowledge-base?view=community&question=${questionId}`
    : '/knowledge-base?view=community';
  return <Navigate to={to} replace />;
}
