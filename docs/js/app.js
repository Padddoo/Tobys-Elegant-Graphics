/* ============================================================
   app.js — Fortschritt (localStorage), DOM-Helfer, Header.
   ============================================================ */

const TEG = (() => {
  const STORE_KEY = "teg-progress-v1";

  // ---- Fortschritt ----

  function getDone() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function setDone(id, done) {
    const s = getDone();
    if (done) s.add(id); else s.delete(id);
    localStorage.setItem(STORE_KEY, JSON.stringify([...s]));
  }

  function isDone(id) {
    return getDone().has(id);
  }

  // ---- DOM-Helfer ----

  // el("div", {class: "x", onclick: fn}, child1, "text", ...)
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2), v);
      } else if (v !== false && v != null) {
        node.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      node.append(c.nodeType ? c : document.createTextNode(c));
    }
    return node;
  }

  // ---- Header (auf jeder Seite identisch) ----

  function renderHeader(active) {
    const header = el("header", { class: "site-header" },
      el("div", { class: "container" },
        el("a", { class: "brand", href: "index.html" }, "Toby's Elegant Graphics"),
        el("nav", { class: "site-nav" },
          el("a", { href: "index.html", class: active === "path" ? "active" : "" }, "Lernpfad"),
          el("a", { href: "chooser.html", class: active === "chooser" ? "active" : "" }, "Chart-Chooser"),
          el("a", { href: "https://github.com/Padddoo/Tobys-Elegant-Graphics",
                    target: "_blank", rel: "noopener" }, "GitHub")
        )
      )
    );
    document.body.prepend(header);
  }

  function renderFooter() {
    document.body.append(
      el("footer", { class: "site-footer" },
        el("div", { class: "container" },
          "Toby's Elegant Graphics · 30 Visualisierungs-Patterns zum Anfassen · ",
          "Dein Fortschritt wird nur in diesem Browser gespeichert (localStorage). · MIT-Lizenz"
        )
      )
    );
  }

  return { getDone, setDone, isDone, el, renderHeader, renderFooter };
})();
