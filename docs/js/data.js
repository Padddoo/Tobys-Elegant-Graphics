/* ============================================================
   data.js — CSV laden, parsen, cachen.
   Der Datensatz wird einmal geladen und über Modul-Wechsel
   hinweg wiederverwendet (sessionweiter Cache im Modul-Scope).
   ============================================================ */

const TEG_DATA = (() => {
  let cache = null;

  // Kleiner CSV-Parser: kommagetrennt, unterstützt doppelte
  // Anführungszeichen (RFC-4180-light). Reicht für unsere Datensätze.
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // Spalten-Typisierung für shipping_orders_2024.csv
  const NUMERIC = new Set(["order_value_eur", "delivery_days"]);

  function toObjects(rows) {
    const header = rows[0];
    return rows.slice(1).map((r) => {
      const o = {};
      header.forEach((h, i) => {
        o[h] = NUMERIC.has(h) ? Number(r[i]) : r[i];
      });
      return o;
    });
  }

  async function load() {
    if (cache) return cache;
    const res = await fetch("data/shipping_orders_2024.csv");
    if (!res.ok) throw new Error(`Datensatz nicht ladbar (HTTP ${res.status})`);
    cache = toObjects(parseCSV(await res.text()));
    return cache;
  }

  // ---- kleine Statistik-Helfer für die Labore ----

  function column(rows, key) {
    return rows.map((r) => r[key]);
  }

  function groupBy(rows, key) {
    const m = new Map();
    rows.forEach((r) => {
      const k = r[key];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return m;
  }

  return { load, column, groupBy };
})();
