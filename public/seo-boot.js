/**
 * Sync SEO for the app SPA HTML shell before React hydrates.
 * Gives non-JS crawlers a canonical URL, title, and H1 per route.
 */
(function () {
  var APP = "https://app.resolvemeq.net";
  var MARKETING = "https://resolvemeq.net";

  function normPath(p) {
    if (!p) return "/";
    p = String(p).split("?")[0].split("#")[0];
    if (p.length > 1 && p.slice(-1) === "/") p = p.slice(0, -1) || "/";
    return p || "/";
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
      };
    }
    var articleH1 = articleTitleFromPath(path);
    if (articleH1) {
      return {
        title: articleH1 + " — " + BASE + " Knowledge Base",
        desc: "IT support article: " + articleH1 + ". Part of the ResolveMeQ public knowledge base.",
        h1: articleH1,
      };
    }
    var communityH1 = communityTitleFromPath(path);
    if (communityH1) {
      return {
        title: communityH1 + " — " + BASE + " Community Q&A",
        desc: "Community IT support question: " + communityH1 + ". Answers and discussion on ResolveMeQ.",
        h1: communityH1,
      };
    }
    if (path === "/login" || path === "/signup") {
      return {
        title: (path === "/login" ? "Sign in" : "Sign up") + " — " + BASE,
        desc: DEFAULT_DESC,
        h1: path === "/login" ? "Sign in to ResolveMeQ" : "Create your ResolveMeQ account",
      };
    }
    return {
      title: DEFAULT_TITLE,
      desc: DEFAULT_DESC,
      h1: BASE + " IT support",
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

  setMetaByName("description", seo.desc);
  setMetaByName("robots", "index, follow");

  var link = document.getElementById("rmq-canonical");
  if (link) link.setAttribute("href", canonical);

  var h1El = document.getElementById("rmq-h1");
  if (h1El) h1El.textContent = seo.h1 || BASE;

  // Expose for debugging; not required at runtime.
  window.__RMQ_APP_SEO = { path: path, marketing: MARKETING };
})();
