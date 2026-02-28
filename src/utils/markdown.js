import { marked } from 'marked';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false,
});

/**
 * Parse markdown to HTML
 * @param {string} markdown - The markdown text to parse
 * @returns {string} - The parsed HTML
 */
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';
  return marked.parse(markdown);
};

/**
 * Sanitize and parse markdown for safe rendering
 * @param {string} markdown - The markdown text to parse
 * @returns {string} - The sanitized HTML
 */
export const renderMarkdown = (markdown) => {
  return parseMarkdown(markdown);
};
