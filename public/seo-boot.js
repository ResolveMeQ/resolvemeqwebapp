/**
 * Sync SEO for the app SPA HTML shell before React hydrates.
 * Keeps canonical, title, meta, OG/Twitter, robots, and JSON-LD aligned with the URL.
 */
(function () {
  var APP = "https://app.resolvemeq.net";
  var MARKETING = "https://resolvemeq.net";
  var OG_IMAGE = MARKETING + "/assets/og-image.png";

  var PRIVATE_PREFIXES = [
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

  function normPath(p) {
    if (!p) return "/";
    p = String(p).split("?")[0].split("#")[0];
    if (p.length > 1 && p.slice(-1) === "/") p = p.slice(0, -1) || "/";
    return p || "/";
  }

  function isPrivatePath(path) {
    if (path === "/") return true;
    return PRIVATE_PREFIXES.some(function (prefix) {
      return path === prefix || path.indexOf(prefix + "/") === 0;
    });
  }

  var path = normPath(window.location.pathname);
  var search = window.location.search || "";
  var canonical = APP + path + search;

  var BASE = "ResolveMeQ";
  var DEFAULT_TITLE = BASE + " - AI-Powered IT Support";
  var DEFAULT_DESC =
    "Browse ResolveMeQ knowledge base articles and community Q&A for IT troubleshooting, or sign in to manage tickets and workflows.";

  function articleTitleFromPath(p) {
    var prefix = "/knowledge-base/article/";
    if (p.indexOf(prefix) !== 0) return null;
    var slug = p.slice(prefix.length);
    var tilde = slug.lastIndexOf("~");
    if (tilde < 0) return null;
    return slug
      .slice(0, tilde)
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function communityTitleFromPath(p) {
    var prefix = "/community/q/";
    if (p.indexOf(prefix) !== 0) return null;
    var slug = p.slice(prefix.length).replace(/-\d+$/, "");
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function pick() {
    if (isPrivatePath(path)) {
      return {
        title: DEFAULT_TITLE,
        desc: DEFAULT_DESC,
        h1: BASE,
        noindex: true,
      };
    }
    if (path === "/knowledge-base") {
      var isCommunity = search.indexOf("view=community") >= 0;
      return {
        title: isCommunity
          ? "Community Q&A — " + BASE + " Knowledge Base"
          : "Knowledge Base — " + BASE,
        desc: isCommunity
          ? "Community IT support Q&A on ResolveMeQ: questions, answers, and accepted solutions from real troubleshooting sessions."
          : "ResolveMeQ knowledge base articles for VPN, email, printers, MFA, onboarding, and common IT issues.",
        h1: isCommunity ? "Community Q&A" : "Knowledge Base",
        noindex: false,
        ogType: "website",
      };
    }
    var articleH1 = articleTitleFromPath(path);
    if (articleH1) {
      return {
        title: articleH1 + " — " + BASE + " Knowledge Base",
        desc: "IT support article: " + articleH1 + ". Part of the ResolveMeQ public knowledge base.",
        h1: articleH1,
        noindex: false,
        ogType: "article",
        jsonLdType: "Article",
        jsonLdName: articleH1,
      };
    }
    var communityH1 = communityTitleFromPath(path);
    if (communityH1) {
      return {
        title: communityH1 + " — " + BASE + " Community Q&A",
        desc: "Community IT support question: " + communityH1 + ". Answers and discussion on ResolveMeQ.",
        h1: communityH1,
        noindex: false,
        ogType: "article",
        jsonLdType: "QAPage",
        jsonLdName: communityH1,
      };
    }
    return {
      title: DEFAULT_TITLE,
      desc: DEFAULT_DESC,
      h1: BASE + " IT support",
      noindex: false,
    };
  }

  var seo = pick();

  document.title = seo.title;

  function setMetaByName(name, content) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setMetaByProperty(property, content) {
    var el = document.querySelector('meta[property="' + property + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  setMetaByName("description", seo.desc);
  setMetaByName("robots", seo.noindex ? "noindex, nofollow" : "index, follow");

  setMetaByProperty("og:type", seo.ogType || "website");
  setMetaByProperty("og:url", canonical);
  setMetaByProperty("og:title", seo.title);
  setMetaByProperty("og:description", seo.desc);
  setMetaByProperty("og:image", OG_IMAGE);
  setMetaByProperty("og:site_name", BASE);

  setMetaByName("twitter:card", "summary_large_image");
  setMetaByName("twitter:url", canonical);
  setMetaByName("twitter:title", seo.title);
  setMetaByName("twitter:description", seo.desc);
  setMetaByName("twitter:image", OG_IMAGE);

  var link = document.getElementById("rmq-canonical");
  if (link) link.setAttribute("href", canonical);

  var h1El = document.getElementById("rmq-h1");
  if (h1El) h1El.textContent = seo.h1 || BASE;

  if (seo.jsonLdType && !seo.noindex) {
    var ld = {
      "@context": "https://schema.org",
      "@type": seo.jsonLdType,
      name: seo.jsonLdName,
      description: seo.desc,
      url: canonical,
      isPartOf: {
        "@type": "WebSite",
        name: BASE,
        url: APP + "/knowledge-base",
      },
      publisher: {
        "@type": "Organization",
        name: "ResolveMeQ",
        url: MARKETING + "/",
        logo: {
          "@type": "ImageObject",
          url: MARKETING + "/brand/logo-mark.png",
        },
      },
    };
    var ldEl = document.getElementById("rmq-jsonld");
    if (!ldEl) {
      ldEl = document.createElement("script");
      ldEl.id = "rmq-jsonld";
      ldEl.type = "application/ld+json";
      document.head.appendChild(ldEl);
    }
    ldEl.textContent = JSON.stringify(ld);
  }

  window.__RMQ_APP_SEO = { path: path, marketing: MARKETING };
})();
