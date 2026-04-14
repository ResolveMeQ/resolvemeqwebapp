import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';

function parseKbId(slugAndId) {
  const raw = String(slugAndId || '').trim();
  const uuidMatch = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  if (uuidMatch?.[0]) {
    return uuidMatch[0];
  }
  const splitIdx = raw.lastIndexOf('~');
  if (splitIdx < 0) return null;
  const id = raw.slice(splitIdx + 1).trim();
  return id || null;
}

export default function KnowledgeBaseArticleRoute() {
  const { slugAndId } = useParams();
  const kbId = useMemo(() => parseKbId(slugAndId), [slugAndId]);
  if (!kbId) {
    return <Navigate to="/knowledge-base" replace />;
  }
  return <Navigate to={`/knowledge-base?kb=${encodeURIComponent(kbId)}`} replace />;
}
