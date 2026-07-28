import { Helmet } from "react-helmet-async";
import {
  APP_URL,
  MARKETING_URL,
  OG_IMAGE,
  TWITTER_IMAGE,
  canonicalUrl,
} from "./siteDefaults";

/**
 * Per-route title, description, canonical, Open Graph, Twitter, and optional JSON-LD.
 */
export default function PublicSeo({
  title,
  description,
  path,
  ogType = "website",
  ogImage = OG_IMAGE,
  twitterImage = TWITTER_IMAGE,
  noindex = false,
  jsonLd,
}) {
  const normalizedPath = path?.startsWith("/") ? path : `/${path || ""}`;
  const pathOnly = normalizedPath.split("?")[0];
  const search = normalizedPath.includes("?") ? normalizedPath.slice(normalizedPath.indexOf("?")) : "";
  const url = canonicalUrl(pathOnly, search);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="ResolveMeQ" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}

export function buildArticleJsonLd({ article, path }) {
  const title = article?.title?.trim();
  if (!title) return null;
  const description =
    stripForJsonLd(article?.summary) ||
    stripForJsonLd(article?.content)?.slice(0, 280) ||
    `IT support article: ${title}.`;
  const url = `${APP_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    name: title,
    description,
    url,
    dateModified: article?.updated_at || article?.created_at || undefined,
    datePublished: article?.created_at || undefined,
    author: {
      "@type": "Organization",
      name: "ResolveMeQ",
    },
    publisher: {
      "@type": "Organization",
      name: "ResolveMeQ",
      url: `${MARKETING_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${MARKETING_URL}/brand/logo-mark.png`,
      },
    },
    isPartOf: {
      "@type": "WebSite",
      name: "ResolveMeQ Knowledge Base",
      url: `${APP_URL}/knowledge-base`,
    },
  };
}

export function buildQuestionJsonLd({ question, path }) {
  const title = question?.title?.trim();
  if (!title) return null;
  const description =
    stripForJsonLd(question?.body)?.slice(0, 280) ||
    `Community IT support question: ${title}.`;
  const url = `${APP_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: title,
      text: description,
      answerCount: Array.isArray(question?.answers) ? question.answers.length : undefined,
      url,
    },
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "ResolveMeQ Community Q&A",
      url: `${APP_URL}/knowledge-base?view=community`,
    },
  };
}

function stripForJsonLd(value) {
  if (!value) return "";
  return String(value)
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
