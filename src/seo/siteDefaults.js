/** App domain SEO defaults — OG images served from marketing CDN. */
export const APP_URL = "https://app.resolvemeq.net";
export const MARKETING_URL = "https://resolvemeq.net";

export const SITE_NAME = "ResolveMeQ";

export const DEFAULT_TITLE = "ResolveMeQ - AI-Powered IT Support";

export const DEFAULT_DESCRIPTION =
  "Browse ResolveMeQ knowledge base articles and community Q&A for IT troubleshooting, or sign in to manage tickets and workflows.";

export const OG_IMAGE = `${MARKETING_URL}/assets/og-image.png`;
export const TWITTER_IMAGE = `${MARKETING_URL}/assets/twitter-image.png`;

export const PRIVATE_PATH_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/tickets",
  "/workflows",
  "/settings",
  "/billing",
  "/analytics",
  "/teams",
  "/users",
  "/escalation-queue",
];

export function isPrivatePath(pathname) {
  const path = normalizePath(pathname);
  if (path === "/") return true;
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (path === prefix || path.startsWith(`${prefix}/`))
  );
}

export function normalizePath(pathname) {
  let path = pathname && pathname.length ? pathname : "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1) || "/";
  return path;
}

export function canonicalUrl(pathname, search = "") {
  const path = normalizePath(pathname);
  return `${APP_URL}${path}${search || ""}`;
}

function titleCaseSlug(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function routeSeoDefaults(pathname, search = "") {
  const path = normalizePath(pathname);

  if (isPrivatePath(path)) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path,
      noindex: true,
    };
  }

  if (path === "/knowledge-base") {
    const isCommunity = search.includes("view=community");
    return {
      title: isCommunity
        ? `Community Q&A — ${SITE_NAME} Knowledge Base`
        : `Knowledge Base — ${SITE_NAME}`,
      description: isCommunity
        ? "Community IT support Q&A on ResolveMeQ: questions, answers, and accepted solutions from real troubleshooting sessions."
        : "ResolveMeQ knowledge base articles for VPN, email, printers, MFA, onboarding, and common IT issues.",
      path: `/knowledge-base${search || ""}`,
      noindex: false,
    };
  }

  const articlePrefix = "/knowledge-base/article/";
  if (path.startsWith(articlePrefix)) {
    const slug = path.slice(articlePrefix.length);
    const title = titleCaseSlug(slug.split("~")[0]);
    return {
      title: `${title} — ${SITE_NAME} Knowledge Base`,
      description: `IT support article: ${title}. Part of the ResolveMeQ public knowledge base.`,
      path,
      noindex: false,
      ogType: "article",
    };
  }

  const communityPrefix = "/community/q/";
  if (path.startsWith(communityPrefix)) {
    const slug = path.slice(communityPrefix.length).replace(/-\d+$/, "");
    const title = titleCaseSlug(slug);
    return {
      title: `${title} — ${SITE_NAME} Community Q&A`,
      description: `Community IT support question: ${title}. Answers and discussion on ResolveMeQ.`,
      path,
      noindex: false,
      ogType: "article",
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path,
    noindex: false,
  };
}

export function slugifyTitle(value) {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120) || "article"
  );
}

export function articlePublicPath(article) {
  const id = article?.kb_id ?? article?.id;
  if (!id) return "/knowledge-base";
  const slug = slugifyTitle(article?.title);
  return `/knowledge-base/article/${slug}~${encodeURIComponent(String(id))}`;
}

export function communityPublicPath(question) {
  if (!question?.id) return "/knowledge-base?view=community";
  return `/community/q/${slugifyTitle(question.title)}-${question.id}`;
}

export function stripMarkdown(text) {
  if (!text) return "";
  return String(text)
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .trim();
}
