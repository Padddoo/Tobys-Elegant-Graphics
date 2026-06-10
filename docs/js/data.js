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

  // Nicht-numerische Spalten über alle Datensätze hinweg
  const TEXT_COLS = new Set([
    "order_id", "order_date", "region", "carrier", "product_category",
    "product_id", "category", "state_id", "state_name",
  ]);

  function toObjects(rows) {
    const header = rows[0];
    return rows.slice(1).map((r) => {
      const o = {};
      header.forEach((h, i) => {
        o[h] = TEXT_COLS.has(h) ? r[i] : Number(r[i]);
      });
      return o;
    });
  }

  const fileCache = new Map();

  async function fetchCSV(path) {
    if (fileCache.has(path)) return fileCache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Datensatz nicht ladbar (HTTP ${res.status})`);
    const data = toObjects(parseCSV(await res.text()));
    fileCache.set(path, data);
    return data;
  }

  async function loadJSON(path) {
    if (fileCache.has(path)) return fileCache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Daten nicht ladbar (HTTP ${res.status})`);
    const data = await res.json();
    fileCache.set(path, data);
    return data;
  }

  async function load() {
    if (cache) return cache;
    cache = await fetchCSV("data/shipping_orders_2024.csv");
    return cache;
  }

  const loadProducts = () => fetchCSV("data/product_metrics.csv");
  const loadGeoOrders = () => fetchCSV("data/orders_by_bundesland.csv");
  const loadProjections = () => loadJSON("data/projections.json");
  const loadGeoJSON = () => loadJSON("data/bundeslaender.geo.json");

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

  return { load, loadProducts, loadGeoOrders, loadProjections, loadGeoJSON, column, groupBy };
})();
