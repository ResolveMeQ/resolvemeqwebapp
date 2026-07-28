import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import PublicSeo, { buildArticleJsonLd, buildQuestionJsonLd } from "./PublicSeo";
import {
  articlePublicPath,
  communityPublicPath,
  routeSeoDefaults,
  stripMarkdown,
} from "./siteDefaults";

/** Route-level SEO for the app shell (auth, KB index, redirects). */
export function AppRouteSeo() {
  const { pathname, search } = useLocation();
  const defaults = useMemo(() => routeSeoDefaults(pathname, search), [pathname, search]);

  return (
    <PublicSeo
      title={defaults.title}
      description={defaults.description}
      path={`${defaults.path}${search && !defaults.path.includes("?") ? search : ""}`}
      ogType={defaults.ogType}
      noindex={defaults.noindex}
    />
  );
}

/** Dynamic SEO when a KB article or community question is open. */
export function KnowledgeBaseSeo({ selectedArticle, selectedQuestion, viewMode }) {
  const { search } = useLocation();

  const seo = useMemo(() => {
    if (selectedArticle?.title) {
      const path = articlePublicPath(selectedArticle);
      const summary =
        stripMarkdown(selectedArticle.summary || selectedArticle.content || "").slice(0, 160) ||
        `IT support article: ${selectedArticle.title}. Part of the ResolveMeQ public knowledge base.`;
      return {
        title: `${selectedArticle.title} — ResolveMeQ Knowledge Base`,
        description: summary,
        path,
        ogType: "article",
        jsonLd: buildArticleJsonLd({ article: selectedArticle, path }),
      };
    }

    if (selectedQuestion?.title && viewMode === "community") {
      const path = communityPublicPath(selectedQuestion);
      const summary =
        stripMarkdown(selectedQuestion.body || "").slice(0, 160) ||
        `Community IT support question: ${selectedQuestion.title}. Answers and discussion on ResolveMeQ.`;
      return {
        title: `${selectedQuestion.title} — ResolveMeQ Community Q&A`,
        description: summary,
        path,
        ogType: "article",
        jsonLd: buildQuestionJsonLd({ question: selectedQuestion, path }),
      };
    }

    const defaults = routeSeoDefaults("/knowledge-base", search);
    return {
      title: defaults.title,
      description: defaults.description,
      path: `/knowledge-base${search || ""}`,
      ogType: "website",
      jsonLd: null,
    };
  }, [selectedArticle, selectedQuestion, viewMode, search]);

  return (
    <PublicSeo
      title={seo.title}
      description={seo.description}
      path={seo.path}
      ogType={seo.ogType}
      jsonLd={seo.jsonLd}
    />
  );
}
