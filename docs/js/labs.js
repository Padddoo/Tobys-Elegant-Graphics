/* ============================================================
   labs.js — die interaktiven Parameter-Labore (Plotly-Configs).
   Ein Eintrag pro Modul: Controls + render(rows, values).
   render() liefert { traces, layout } für Plotly.react.
   ============================================================ */

const TEG_LABS = (() => {
  const ACCENT = "#4338ca";
  const BAD = "#b91c1c";

  function baseLayout(overrides = {}) {
    const mobile = typeof window !== "undefined" && window.innerWidth < 640;
    return Object.assign({
      font: { family: "Inter, system-ui, sans-serif", size: mobile ? 11 : 13, color: "#1d1d29" },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: mobile ? { l: 44, r: 10, t: 40, b: 44 } : { l: 60, r: 20, t: 48, b: 52 },
      height: mobile ? 340 : 450,
      bargap: 0.05,
      showlegend: false,
    }, overrides);
  }

  const VAR_LABELS = {
    delivery_days: "Lieferzeit (Tage)",
    order_value_eur: "Bestellwert (EUR)",
  };

  // Bin-Kanten/Histogramm selbst berechnen — so steuern wir die
  // Bin-Anzahl exakt und können auf log-transformierten Daten binnen.
  function histogram(values, nbins) {
    const min = Math.min(...values), max = Math.max(...values);
    const width = (max - min) / nbins || 1;
    const counts = new Array(nbins).fill(0);
    values.forEach((v) => {
      let idx = Math.floor((v - min) / width);
      if (idx >= nbins) idx = nbins - 1;
      counts[idx]++;
    });
    const centers = counts.map((_, i) => min + (i + 0.5) * width);
    return { counts, centers, width };
  }

  const PALETTE = ["#4338ca", "#0d9488", "#d97706", "#be185d", "#65a30d"];

  const GROUP_LABELS = {
    carrier: "Carrier",
    region: "Region",
    product_category: "Produktkategorie",
  };

  function median(arr) {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // Trailing Rolling Mean; die ersten w-1 Werte bleiben null.
  function rolling(values, w) {
    if (w <= 1) return values.slice();
    const out = [];
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= w) sum -= values[i - w];
      out.push(i >= w - 1 ? sum / w : null);
    }
    return out;
  }

  function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

  function sd(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
  }

  // Gauß-KDE auf festem Gitter. bw = Bandbreite in Dateneinheiten.
  function kde(values, bw, gridN = 160, lo = null, hi = null) {
    const min = lo ?? Math.min(...values) - 2 * bw;
    const max = hi ?? Math.max(...values) + 2 * bw;
    const xs = [], ys = [];
    const norm = 1 / (values.length * bw * Math.sqrt(2 * Math.PI));
    for (let i = 0; i < gridN; i++) {
      const x = min + (i / (gridN - 1)) * (max - min);
      let s = 0;
      for (const v of values) {
        const u = (x - v) / bw;
        if (u > -4 && u < 4) s += Math.exp(-0.5 * u * u);
      }
      xs.push(x); ys.push(s * norm);
    }
    return { xs, ys };
  }

  // Faustregel nach Silverman als Bandbreiten-Referenz
  function silverman(values) {
    return 1.06 * sd(values) * Math.pow(values.length, -0.2);
  }

  // LOESS (lokal-lineare Regression, Tricube-Gewichte)
  function loess(xv, yv, span, evalN = 80) {
    const idx = xv.map((_, i) => i).sort((a, b) => xv[a] - xv[b]);
    const x = idx.map((i) => xv[i]), y = idx.map((i) => yv[i]);
    const n = x.length, win = Math.max(4, Math.floor(span * n));
    const outX = [], outY = [];
    for (let e = 0; e < evalN; e++) {
      const x0 = x[0] + (e / (evalN - 1)) * (x[n - 1] - x[0]);
      // Fenster: die win nächsten Punkte um x0
      let lo = 0;
      while (lo + win < n && Math.abs(x[lo + win] - x0) < Math.abs(x[lo] - x0)) lo++;
      const hiD = Math.max(Math.abs(x[lo] - x0), Math.abs(x[lo + win - 1] - x0)) || 1;
      let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      for (let i = lo; i < lo + win; i++) {
        const w = Math.pow(1 - Math.pow(Math.abs(x[i] - x0) / hiD, 3), 3);
        sw += w; swx += w * x[i]; swy += w * y[i];
        swxx += w * x[i] * x[i]; swxy += w * x[i] * y[i];
      }
      const den = sw * swxx - swx * swx;
      const b = den ? (sw * swxy - swx * swy) / den : 0;
      const a = (swy - b * swx) / sw;
      outX.push(x0); outY.push(a + b * x0);
    }
    return { xs: outX, ys: outY };
  }

  function ecdf(values) {
    const xs = [...values].sort((a, b) => a - b);
    const ys = xs.map((_, i) => (i + 1) / xs.length);
    return { xs, ys };
  }

  // Beeswarm-Layout: x-Offsets, die Überlappung vermeiden (Bin-basiert)
  function beeswarmOffsets(values, binCount = 40) {
    const min = Math.min(...values), max = Math.max(...values);
    const w = (max - min) / binCount || 1;
    const bins = new Map();
    return values.map((v) => {
      const b = Math.floor((v - min) / w);
      const k = bins.get(b) || 0;
      bins.set(b, k + 1);
      // 0, +1, -1, +2, -2, … abwechselnd nach außen
      return (k % 2 ? 1 : -1) * Math.ceil(k / 2);
    });
  }

  // Mittelwert + z*Standardfehler pro Gruppe
  function groupCI(rows, key, varName, z) {
    return [...TEG_DATA.groupBy(rows, key).entries()].map(([name, rs]) => {
      const vals = rs.map((r) => r[varName]);
      const m = mean(vals), se = sd(vals) / Math.sqrt(vals.length);
      return { name, mean: m, lo: m - z * se, hi: m + z * se, n: vals.length };
    }).sort((a, b) => a.mean - b.mean);
  }

  const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
                  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  // 12 geordnete Farben (kühl → warm) für Monats-Reihen
  const PALETTE12 = ["#312e81", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#38bdf8",
                     "#0d9488", "#65a30d", "#ca8a04", "#d97706", "#ea580c", "#be185d"];

  function monthOf(dateStr) { return Number(dateStr.slice(5, 7)) - 1; }

  // Deterministischer Pseudozufall (stabiles Jitter über Re-Renders)
  function seededRand(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // Deutsche Labels für die Produkt-Features (#19–#23)
  const FEAT_LABELS = {
    weight_kg: "Gewicht (kg)", volume_l: "Volumen (l)", price_eur: "Preis (€)",
    margin_pct: "Marge (%)", monthly_sales: "Absatz/Monat", return_rate_pct: "Retouren (%)",
    shipping_cost_eur: "Versand (€)", rating: "Bewertung", restock_days: "Restock (Tage)",
  };

  const CATEGORIES = ["Electronics", "Apparel", "Home", "Books", "Food"];
  const catColor = (c) => PALETTE[CATEGORIES.indexOf(c) % PALETTE.length];

  // Pearson-Korrelation; für Spearman vorher rank() anwenden
  function pearson(a, b) {
    const ma = mean(a), mb = mean(b);
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) {
      num += (a[i] - ma) * (b[i] - mb);
      da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2;
    }
    return num / Math.sqrt(da * db);
  }

  function rank(arr) {
    const idx = arr.map((_, i) => i).sort((a, b) => arr[a] - arr[b]);
    const out = new Array(arr.length);
    idx.forEach((origI, r) => { out[origI] = r; });
    return out;
  }

  // Tages-Aggregat: order_date → Anzahl / Umsatz / Ø Lieferzeit
  function dailySeries(rows, metric) {
    const m = new Map();
    rows.forEach((r) => {
      let o = m.get(r.order_date);
      if (!o) { o = { n: 0, sum: 0, del: 0 }; m.set(r.order_date, o); }
      o.n++; o.sum += r.order_value_eur; o.del += r.delivery_days;
    });
    const dates = [...m.keys()].sort();
    const y = dates.map((d) => {
      const o = m.get(d);
      return metric === "orders" ? o.n
        : metric === "revenue" ? Math.round(o.sum)
        : o.del / o.n;
    });
    return { dates, y };
  }

  return {
    /* ========================================================
       #01 Histogramm
       ======================================================== */
    "01": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        { id: "bins", type: "range", label: "Anzahl Bins", min: 5, max: 120, step: 1, default: 40 },
        { id: "density", type: "checkbox", label: "Dichte statt Anzahl", default: false },
        { id: "logx", type: "checkbox", label: "log-Skala (x)", default: false },
      ],

      render(rows, v) {
        let values = TEG_DATA.column(rows, v.variable);
        let xTitle = VAR_LABELS[v.variable];
        let tickvals, ticktext;

        if (v.logx) {
          // Auf log10-transformierten Werten binnen → gleichmäßige
          // Bins auf der log-Skala; Ticks zeigen Originalwerte.
          values = values.map((x) => Math.log10(x));
          xTitle += " — log-Skala";
          const ticks = v.variable === "order_value_eur"
            ? [5, 10, 20, 50, 100, 200, 500, 1000, 2000]
            : [1, 2, 3, 5, 8, 12, 20];
          tickvals = ticks.map((t) => Math.log10(t));
          ticktext = ticks.map(String);
        }

        const { counts, centers, width } = histogram(values, v.bins);
        const n = values.length;
        const y = v.density ? counts.map((c) => c / (n * width)) : counts;

        return {
          traces: [{
            type: "bar", x: centers, y, width: width * 0.96,
            marker: { color: ACCENT },
            hovertemplate: "%{y}<extra></extra>",
          }],
          layout: baseLayout({
            xaxis: { title: { text: xTitle }, tickvals, ticktext },
            yaxis: { title: { text: v.density ? "Dichte" : "Anzahl Bestellungen" } },
          }),
        };
      },

      insight(v) {
        if (v.variable === "order_value_eur" && !v.logx)
          return "Stark rechtsschief: Der Mittelwert (69 €) liegt 40 % über dem Median (50 €). Probier die log-Skala — wird die Form symmetrisch?";
        if (v.variable === "order_value_eur" && v.logx)
          return "Auf der log-Skala fast symmetrisch → die Bestellwerte sind annähernd log-normalverteilt. Das ist selbst ein Analyse-Ergebnis!";
        if (v.bins <= 10)
          return "So wenige Bins glätten die Form weg — Ausreißer und Schiefe verschwinden. Zieh den Regler nach rechts.";
        if (v.bins >= 100)
          return "Sehr viele Bins: Einzelne Balken werden zu Rauschen. Die „richtige“ Bin-Anzahl liegt fast immer dazwischen — testen gehört dazu.";
        return "Verändere die Bin-Anzahl und beobachte, wann die Form stabil bleibt — das ist der verlässliche Bereich.";
      },

      // Gut-vs.-Schlecht-Vergleich (fester Datenausschnitt: Bestellwerte)
      goodBad(rows, mode) {
        const values = TEG_DATA.column(rows, "order_value_eur");
        const { counts, centers, width } = histogram(values, mode === "good" ? 50 : 5);
        return {
          traces: [{
            type: "bar", x: centers, y: counts, width: width * 0.96,
            marker: { color: mode === "good" ? ACCENT : BAD },
            hovertemplate: "%{y}<extra></extra>",
          }],
          layout: baseLayout({
            title: {
              text: mode === "good"
                ? "Bestellwerte: rechtsschief mit langem Schwanz (50 Bins)"
                : "Bestellwerte: „sieht harmlos aus“ (5 Bins)",
              font: { size: 15 },
            },
            xaxis: { title: { text: "Bestellwert (EUR)" } },
            yaxis: { title: { text: "Anzahl Bestellungen" } },
          }),
        };
      },
    },

    /* ========================================================
       #03 Boxplot
       ======================================================== */
    "03": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "none", label: "— keine Gruppierung —" },
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        { id: "points", type: "checkbox", label: "Alle Punkte zeigen", default: false },
        { id: "logy", type: "checkbox", label: "log-Skala (y)", default: false },
      ],

      render(rows, v) {
        const groups = v.groupby === "none"
          ? [["Alle Bestellungen", rows]]
          : [...TEG_DATA.groupBy(rows, v.groupby).entries()];
        const withVals = groups
          .map(([name, rs]) => [name, rs.map((r) => r[v.variable])])
          .sort((a, b) => median(a[1]) - median(b[1]));

        const traces = withVals.map(([name, vals], i) => ({
          type: "box", name, y: vals,
          boxpoints: v.points ? "all" : "outliers",
          jitter: 0.55, pointpos: 0,
          marker: { color: PALETTE[i % PALETTE.length], size: 3,
                    opacity: v.points ? 0.35 : 0.6 },
          line: { width: 1.5 },
        }));

        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: GROUP_LABELS[v.groupby] || "" } },
            yaxis: {
              title: { text: VAR_LABELS[v.variable] },
              type: v.logy ? "log" : "linear",
            },
          }),
        };
      },

      insight(v) {
        if (v.variable === "order_value_eur" && !v.logy)
          return "Die vielen Punkte oberhalb des Whiskers sind keine Datenfehler — Bestellwerte sind schlicht rechtsschief. Probier die log-Skala: Auf ihr verschwinden die meisten „Ausreißer“.";
        if (v.variable === "delivery_days" && v.groupby === "carrier")
          return "UPS liefert im Median in 2,3 Tagen, Hermes braucht 4,2 — und 7,5 % der Hermes-Sendungen dauern länger als 7 Tage. Genau dieser Schwanz fehlt in jeder Mittelwert-Tabelle.";
        if (v.variable === "delivery_days" && v.groupby === "region")
          return "Alle Regionen liegen beim Median fast gleichauf (2,8–2,9 Tage). Kein Unterschied ist auch ein Befund — hier lohnt sich der Blick auf eine andere Gruppierung.";
        if (v.points)
          return "Die Punkte zeigen, wie viele Daten hinter jeder Box stehen. Eine Box über 20 Punkten verdient weniger Vertrauen als eine über 1.000.";
        if (v.groupby === "none")
          return "Eine einzelne Box komprimiert 5.000 Werte auf fünf Kennzahlen. Gruppier nach Carrier — dort steckt die Geschichte.";
        return "Sortiert wird nach Median — so springen Unterschiede sofort ins Auge. Blende die Punkte ein, um die Datenmenge hinter jeder Box zu sehen.";
      },

      // Gut: Boxplots mit Streuung · Schlecht: nackte Mittelwert-Balken
      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()]
          .map(([name, rs]) => [name, rs.map((r) => r.delivery_days)])
          .sort((a, b) => median(a[1]) - median(b[1]));

        if (mode === "bad") {
          return {
            traces: [{
              type: "bar",
              x: groups.map(([n]) => n),
              y: groups.map(([, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length),
              marker: { color: BAD },
              hovertemplate: "%{y:.2f} Tage<extra></extra>",
            }],
            layout: baseLayout({
              title: { text: "Ø Lieferzeit pro Carrier — nur Mittelwerte", font: { size: 15 } },
              yaxis: { title: { text: "Ø Lieferzeit (Tage)" } },
            }),
          };
        }
        return {
          traces: groups.map(([name, vals], i) => ({
            type: "box", name, y: vals,
            boxpoints: "outliers",
            marker: { color: PALETTE[i % PALETTE.length], size: 3, opacity: 0.6 },
            line: { width: 1.5 },
          })),
          layout: baseLayout({
            title: { text: "Lieferzeit pro Carrier — Verteilung statt Mittelwert", font: { size: 15 } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #13 Scatter Plot
       ======================================================== */
    "13": {
      controls: [
        {
          id: "color", type: "select", label: "Färben nach",
          options: [
            { value: "none", label: "— einfarbig —" },
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "none",
        },
        { id: "size", type: "range", label: "Punktgröße", min: 2, max: 10, step: 1, default: 5 },
        { id: "alpha", type: "range", label: "Deckkraft", min: 0.05, max: 1, step: 0.05, default: 0.6 },
        { id: "logx", type: "checkbox", label: "log-Skala (x)", default: false },
      ],

      render(rows, v) {
        const makeTrace = (rs, name, color) => ({
          type: "scattergl", mode: "markers", name,
          x: rs.map((r) => r.order_value_eur),
          y: rs.map((r) => r.delivery_days),
          marker: { color, size: v.size, opacity: v.alpha },
          hoverinfo: "skip",
        });

        const traces = v.color === "none"
          ? [makeTrace(rows, "", ACCENT)]
          : [...TEG_DATA.groupBy(rows, v.color).entries()]
              .map(([name, rs], i) => makeTrace(rs, name, PALETTE[i % PALETTE.length]));

        return {
          traces,
          layout: baseLayout({
            showlegend: v.color !== "none",
            legend: { orientation: "h", y: 1.12 },
            xaxis: {
              title: { text: "Bestellwert (EUR)" + (v.logx ? " — log-Skala" : "") },
              type: v.logx ? "log" : "linear",
            },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.color === "carrier")
          return "Die Struktur liegt in horizontalen Bändern: Der Carrier bestimmt die Lieferzeit — der Bestellwert nicht. Ohne Färbung wäre dieses Muster unsichtbar.";
        if (v.alpha >= 0.9)
          return "Bei voller Deckkraft verdecken sich 5.000 Punkte gegenseitig — wo die Masse liegt, ist nicht erkennbar. Senk die Deckkraft unter 0,3.";
        if (v.logx)
          return "Die log-x-Achse entzerrt den Klumpen bei kleinen Bestellwerten — jetzt ist die ganze Spanne von 5 € bis 1.778 € lesbar.";
        return "Siehst du einen Trend? Pearson r = −0,01 — praktisch kein linearer Zusammenhang zwischen Bestellwert und Lieferzeit. Auch das ist ein belastbares Ergebnis.";
      },

      // Gut: Transparenz zeigt Dichte · Schlecht: deckende Riesenpunkte
      goodBad(rows, mode) {
        const good = mode === "good";
        return {
          traces: [{
            type: "scattergl", mode: "markers",
            x: rows.map((r) => r.order_value_eur),
            y: rows.map((r) => r.delivery_days),
            marker: good
              ? { color: ACCENT, size: 4, opacity: 0.15 }
              : { color: BAD, size: 9, opacity: 1 },
            hoverinfo: "skip",
          }],
          layout: baseLayout({
            title: {
              text: good
                ? "5.000 Punkte mit Deckkraft 0,15 — die Masse wird sichtbar"
                : "Dieselben 5.000 Punkte, voll deckend — ein einziger Klumpen",
              font: { size: 15 },
            },
            xaxis: { title: { text: "Bestellwert (EUR)" } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #24 Line Chart
       ======================================================== */
    "24": {
      controls: [
        {
          id: "metric", type: "select", label: "Metrik",
          options: [
            { value: "delivery", label: "Ø Lieferzeit (Tage)" },
            { value: "orders", label: "Bestellungen pro Tag" },
            { value: "revenue", label: "Umsatz pro Tag (EUR)" },
          ],
          default: "delivery",
        },
        { id: "window", type: "range", label: "Glättung (Tage)", min: 1, max: 28, step: 1, default: 7 },
        { id: "zero", type: "checkbox", label: "y-Achse bei 0 beginnen", default: false },
      ],

      render(rows, v) {
        const METRIC_LABELS = {
          delivery: "Ø Lieferzeit (Tage)",
          orders: "Bestellungen pro Tag",
          revenue: "Umsatz pro Tag (EUR)",
        };
        const { dates, y } = dailySeries(rows, v.metric);
        const traces = [];

        if (v.window > 1) {
          traces.push({
            type: "scatter", mode: "lines", name: "Tageswerte",
            x: dates, y,
            line: { color: "#c9c9d4", width: 1 },
            hoverinfo: "skip",
          });
          traces.push({
            type: "scatter", mode: "lines", name: `${v.window}-Tage-Schnitt`,
            x: dates, y: rolling(y, v.window),
            line: { color: ACCENT, width: 2.4 },
            connectgaps: false,
          });
        } else {
          traces.push({
            type: "scatter", mode: "lines", name: "Tageswerte",
            x: dates, y,
            line: { color: ACCENT, width: 1.2 },
          });
        }

        return {
          traces,
          layout: baseLayout({
            showlegend: v.window > 1,
            legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: "" } },
            yaxis: {
              title: { text: METRIC_LABELS[v.metric] },
              rangemode: v.zero ? "tozero" : "normal",
            },
          }),
        };
      },

      insight(v) {
        if (v.metric === "delivery" && v.window > 1 && v.window < 21)
          return "Im Dezember steigt die Ø Lieferzeit auf ~4,2 Tage (Rest des Jahres ~3,1) — Peak-Season. Schalt auf „Bestellungen pro Tag“ um: Das Volumen bleibt flach. Die Saisonalität steckt in der Leistung, nicht in der Nachfrage.";
        if (v.window === 1)
          return "Rohe Tageswerte über ~14 Bestellungen rauschen stark — einzelne Spitzen sind Zufall, keine Ereignisse. Glätte mit 7 Tagen, um das Signal zu sehen.";
        if (v.window >= 21)
          return "Starke Glättung zeigt den Trend, verschluckt aber kurze Ereignisse: Der Dezember-Anstieg wird breiter und flacher dargestellt, als er tatsächlich war.";
        return "Volumen und Umsatz sind übers Jahr bemerkenswert stabil (~13–14 Bestellungen/Tag). Kein Trend ist auch ein Befund — er macht z. B. Kapazitätsplanung einfach.";
      },

      // Gut: 7-Tage-Schnitt mit Kontext · Schlecht: nacktes Tagesrauschen
      goodBad(rows, mode) {
        const { dates, y } = dailySeries(rows, "delivery");
        if (mode === "bad") {
          return {
            traces: [{
              type: "scatter", mode: "lines",
              x: dates, y,
              line: { color: BAD, width: 1.2 },
            }],
            layout: baseLayout({
              title: { text: "„Lieferzeiten außer Kontrolle!“ — rohe Tageswerte", font: { size: 15 } },
              yaxis: { title: { text: "Ø Lieferzeit (Tage)" } },
            }),
          };
        }
        return {
          traces: [
            { type: "scatter", mode: "lines", name: "Tageswerte",
              x: dates, y, line: { color: "#c9c9d4", width: 1 }, hoverinfo: "skip" },
            { type: "scatter", mode: "lines", name: "7-Tage-Schnitt",
              x: dates, y: rolling(y, 7), line: { color: ACCENT, width: 2.4 } },
          ],
          layout: baseLayout({
            title: { text: "Stabil bei ~3 Tagen — mit klarem Dezember-Anstieg", font: { size: 15 } },
            yaxis: { title: { text: "Ø Lieferzeit (Tage)" } },
            showlegend: true,
            legend: { orientation: "h", y: 1.12 },
          }),
        };
      },
    },

    /* ========================================================
       #02 Density Plot (KDE)
       ======================================================== */
    "02": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        { id: "bw", type: "range", label: "Bandbreite (× Faustregel)", min: 0.1, max: 3, step: 0.1, default: 1 },
        { id: "groups", type: "checkbox", label: "Nach Carrier aufteilen", default: false },
        { id: "hist", type: "checkbox", label: "Histogramm dahinter", default: true },
      ],

      render(rows, v) {
        const traces = [];
        if (v.groups) {
          [...TEG_DATA.groupBy(rows, "carrier").entries()].forEach(([name, rs], i) => {
            const vals = rs.map((r) => r[v.variable]);
            const { xs, ys } = kde(vals, v.bw * silverman(vals));
            traces.push({ type: "scatter", mode: "lines", name,
              x: xs, y: ys, line: { color: PALETTE[i % PALETTE.length], width: 2 } });
          });
        } else {
          const vals = TEG_DATA.column(rows, v.variable);
          if (v.hist) {
            const { counts, centers, width } = histogram(vals, 50);
            const n = vals.length;
            traces.push({ type: "bar", x: centers, y: counts.map((c) => c / (n * width)),
              width: width * 0.96, marker: { color: "#dddbe8" }, hoverinfo: "skip" });
          }
          const { xs, ys } = kde(vals, v.bw * silverman(vals));
          traces.push({ type: "scatter", mode: "lines", name: "KDE",
            x: xs, y: ys, line: { color: ACCENT, width: 2.5 } });
        }
        return {
          traces,
          layout: baseLayout({
            showlegend: v.groups,
            legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: VAR_LABELS[v.variable] } },
            yaxis: { title: { text: "Dichte" } },
          }),
        };
      },

      insight(v) {
        if (v.bw <= 0.3)
          return "Mini-Bandbreite: Jede Zufallsdelle wird zum „Gipfel“. Diese Struktur ist Rauschen, keine Erkenntnis.";
        if (v.bw >= 2)
          return "Große Bandbreite bügelt die Form glatt — Schiefe und Details verschwinden. Die Kurve verspricht eine Einfachheit, die die Daten nicht haben.";
        if (v.groups)
          return "Fünf glatte Kurven statt fünf übereinandergelegter Histogramme — genau hierfür ist die KDE gemacht. Hermes liegt sichtbar rechts.";
        return "Die Bandbreite ist das KDE-Pendant zur Bin-Breite. Faustregel (Silverman) als Start — dann beide Richtungen testen.";
      },

      goodBad(rows, mode) {
        const vals = TEG_DATA.column(rows, "order_value_eur").filter((x) => x < 400);
        const bwBase = silverman(vals);
        const { xs, ys } = kde(vals, mode === "good" ? bwBase : bwBase * 0.07);
        return {
          traces: [{ type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: mode === "good" ? ACCENT : BAD, width: 2.2 } }],
          layout: baseLayout({
            title: { text: mode === "good"
              ? "Bestellwerte ≤ 400 €: eine glatte, rechtsschiefe Verteilung"
              : "Dieselben Daten: Mini-Bandbreite erfindet Dutzende „Gipfel“", font: { size: 15 } },
            xaxis: { title: { text: "Bestellwert (EUR)" } },
            yaxis: { title: { text: "Dichte" } },
          }),
        };
      },
    },

    /* ========================================================
       #04 Violin Plot
       ======================================================== */
    "04": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        { id: "bw", type: "range", label: "Bandbreite (× Faustregel)", min: 0.2, max: 3, step: 0.1, default: 1 },
        { id: "box", type: "checkbox", label: "Boxplot einblenden", default: true },
      ],

      render(rows, v) {
        const all = TEG_DATA.column(rows, v.variable);
        const bw = v.bw * silverman(all);
        const traces = [...TEG_DATA.groupBy(rows, v.groupby).entries()]
          .map(([name, rs]) => [name, rs.map((r) => r[v.variable])])
          .sort((a, b) => median(a[1]) - median(b[1]))
          .map(([name, vals], i) => ({
            type: "violin", name, y: vals, bandwidth: bw,
            box: { visible: v.box, width: 0.15 },
            line: { color: PALETTE[i % PALETTE.length], width: 1.5 },
            meanline: { visible: false }, points: false,
          }));
        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: GROUP_LABELS[v.groupby] } },
            yaxis: { title: { text: VAR_LABELS[v.variable] } },
          }),
        };
      },

      insight(v) {
        if (v.bw <= 0.4)
          return "Wellige Violinen-Ränder = Rauschen, das wie Struktur aussieht. Die Bandbreite gehört zu jeder Violin-Interpretation dazu.";
        if (v.variable === "delivery_days" && v.groupby === "carrier")
          return "Die Violine zeigt, was der Boxplot verschweigt: Bei Hermes ist die ganze Form nach oben gestreckt — der lange Schwanz ist Teil der Verteilung, kein Ausnahmefall.";
        return "Violin = Boxplot + Form. Der eingeblendete Boxplot liefert die Kennzahlen, die Silhouette die Verteilung dahinter.";
      },

      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()]
          .map(([name, rs]) => [name, rs.map((r) => r.delivery_days)])
          .sort((a, b) => median(a[1]) - median(b[1]));
        const all = TEG_DATA.column(rows, "delivery_days");
        const bw = mode === "good" ? silverman(all) : silverman(all) * 0.12;
        return {
          traces: groups.map(([name, vals], i) => ({
            type: "violin", name, y: vals, bandwidth: bw, points: false,
            box: { visible: false },
            line: { color: mode === "good" ? PALETTE[i % PALETTE.length] : BAD, width: 1.4 },
          })),
          layout: baseLayout({
            title: { text: mode === "good"
              ? "Passende Bandbreite: glatte, vergleichbare Formen"
              : "Zu kleine Bandbreite: jede Violine voller Pseudo-Dellen", font: { size: 15 } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #05 Strip / Jitter Plot
       ======================================================== */
    "05": {
      controls: [
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        { id: "jitter", type: "range", label: "Jitter-Stärke", min: 0, max: 1, step: 0.05, default: 0.35 },
        { id: "alpha", type: "range", label: "Deckkraft", min: 0.05, max: 1, step: 0.05, default: 0.3 },
        { id: "size", type: "range", label: "Punktgröße", min: 2, max: 8, step: 1, default: 4 },
      ],

      render(rows, v) {
        const groups = [...TEG_DATA.groupBy(rows, v.groupby).entries()]
          .sort((a, b) => median(a[1].map((r) => r.delivery_days)) - median(b[1].map((r) => r.delivery_days)));
        const traces = groups.map(([name, rs], gi) => ({
          type: "scattergl", mode: "markers", name,
          x: rs.map((r, i) => gi + (seededRand(gi * 10000 + i) - 0.5) * v.jitter * 0.8),
          y: rs.map((r) => r.delivery_days),
          marker: { color: PALETTE[gi % PALETTE.length], size: v.size, opacity: v.alpha },
          hoverinfo: "skip",
        }));
        return {
          traces,
          layout: baseLayout({
            xaxis: { tickvals: groups.map((_, i) => i), ticktext: groups.map(([n]) => n),
                     title: { text: GROUP_LABELS[v.groupby] } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.jitter === 0)
          return "Ohne Jitter stapeln sich alle Punkte auf einer Linie — wie viele es sind, ist unsichtbar. Genau das löst der horizontale Zufallsversatz.";
        if (v.alpha >= 0.8)
          return "Hohe Deckkraft + 1.000 Punkte pro Gruppe = dichte Wolken ohne Tiefeninformation. Senk die Deckkraft.";
        return "Jeder Punkt eine Bestellung — ehrlicher geht es nicht. Bei Hermes sieht man die Ausreißer-Tage einzeln, nicht als anonyme Box-Punkte.";
      },

      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()];
        const good = mode === "good";
        return {
          traces: groups.map(([name, rs], gi) => ({
            type: "scattergl", mode: "markers", name,
            x: rs.map((r, i) => gi + (good ? (seededRand(gi * 10000 + i) - 0.5) * 0.55 : 0)),
            y: rs.map((r) => r.delivery_days),
            marker: { color: good ? PALETTE[gi % PALETTE.length] : BAD,
                      size: 4, opacity: good ? 0.25 : 1 },
            hoverinfo: "skip",
          })),
          layout: baseLayout({
            title: { text: good
              ? "Jitter + Transparenz: Dichte und Ausreißer sichtbar"
              : "Ohne Jitter: 1.000 Punkte pro Gruppe — als Strich getarnt", font: { size: 15 } },
            xaxis: { tickvals: groups.map((_, i) => i), ticktext: groups.map(([n]) => n) },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #06 Beeswarm Plot
       ======================================================== */
    "06": {
      controls: [
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
          ],
          default: "carrier",
        },
        { id: "sample", type: "range", label: "Punkte pro Gruppe", min: 50, max: 400, step: 25, default: 150 },
        { id: "size", type: "range", label: "Punktgröße", min: 3, max: 9, step: 1, default: 5 },
      ],

      render(rows, v) {
        const groups = [...TEG_DATA.groupBy(rows, v.groupby).entries()]
          .sort((a, b) => median(a[1].map((r) => r.delivery_days)) - median(b[1].map((r) => r.delivery_days)));
        const spacing = 0.0035 * v.size;
        const traces = groups.map(([name, rs], gi) => {
          const step = Math.max(1, Math.floor(rs.length / v.sample));
          const vals = rs.filter((_, i) => i % step === 0).map((r) => r.delivery_days);
          const off = beeswarmOffsets(vals, 48);
          return {
            type: "scattergl", mode: "markers", name,
            x: off.map((o) => gi + o * spacing),
            y: vals,
            marker: { color: PALETTE[gi % PALETTE.length], size: v.size, opacity: 0.75 },
            hoverinfo: "skip",
          };
        });
        return {
          traces,
          layout: baseLayout({
            xaxis: { tickvals: groups.map((_, i) => i), ticktext: groups.map(([n]) => n),
                     title: { text: GROUP_LABELS[v.groupby] }, range: [-0.6, groups.length - 0.4] },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.sample >= 350)
          return "Ab einigen hundert Punkten pro Gruppe stoßen die „Schwärme“ aneinander — der Beeswarm ist ein Werkzeug für kleine bis mittlere n. Danach: Violin oder Boxplot.";
        return "Anders als beim Jitter ist hier nichts zufällig: Jeder Punkt bekommt einen festen Platz, die Silhouette des Schwarms IST die Verteilung.";
      },

      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()];
        const good = mode === "good";
        const per = good ? 150 : 400, size = good ? 5 : 9;
        const spacing = 0.0035 * size;
        return {
          traces: groups.map(([name, rs], gi) => {
            const step = Math.max(1, Math.floor(rs.length / per));
            const vals = rs.filter((_, i) => i % step === 0).map((r) => r.delivery_days);
            const off = beeswarmOffsets(vals, 48);
            return {
              type: "scattergl", mode: "markers", name,
              x: off.map((o) => gi + o * spacing), y: vals,
              marker: { color: good ? PALETTE[gi % PALETTE.length] : BAD, size, opacity: 0.75 },
              hoverinfo: "skip",
            };
          }),
          layout: baseLayout({
            title: { text: good
              ? "Stichprobe + kleine Punkte: saubere Schwärme"
              : "Zu viele, zu große Punkte: Schwärme kollidieren, Form lügt", font: { size: 15 } },
            xaxis: { tickvals: groups.map((_, i) => i), ticktext: groups.map(([n]) => n) },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #07 ECDF Plot
       ======================================================== */
    "07": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        { id: "groups", type: "checkbox", label: "Nach Carrier aufteilen", default: true },
        { id: "logx", type: "checkbox", label: "log-Skala (x)", default: false },
      ],

      render(rows, v) {
        const traces = [];
        if (v.groups) {
          [...TEG_DATA.groupBy(rows, "carrier").entries()].forEach(([name, rs], i) => {
            const { xs, ys } = ecdf(rs.map((r) => r[v.variable]));
            traces.push({ type: "scatter", mode: "lines", name,
              x: xs, y: ys, line: { color: PALETTE[i % PALETTE.length], width: 2, shape: "hv" } });
          });
        } else {
          const { xs, ys } = ecdf(TEG_DATA.column(rows, v.variable));
          traces.push({ type: "scatter", mode: "lines", x: xs, y: ys,
            line: { color: ACCENT, width: 2, shape: "hv" } });
        }
        return {
          traces,
          layout: baseLayout({
            showlegend: v.groups,
            legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: VAR_LABELS[v.variable] }, type: v.logx ? "log" : "linear" },
            yaxis: { title: { text: "Anteil ≤ x" }, tickformat: ".0%" },
          }),
        };
      },

      insight(v) {
        if (v.groups && v.variable === "delivery_days")
          return "Direkt ablesbar: ~90 % der UPS-Pakete sind nach 3 Tagen da — bei Hermes erst gut die Hälfte. Kein Binning, keine Bandbreite: Die ECDF ist parameterfrei.";
        return "Jeder Punkt der Kurve beantwortet eine Frage: „Wie viel Prozent liegen unter x?“ Senkrechter = dichter. Vergleiche funktionieren ohne jede Glättungs-Entscheidung.";
      },

      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()];
        if (mode === "bad") {
          return {
            traces: groups.map(([name, rs], i) => ({
              type: "histogram", name, x: rs.map((r) => r.delivery_days),
              nbinsx: 40, opacity: 0.45, marker: { color: PALETTE[i % PALETTE.length] },
            })),
            layout: baseLayout({
              barmode: "overlay", showlegend: true, legend: { orientation: "h", y: 1.12 },
              title: { text: "5 überlagerte Histogramme: ab 3 Gruppen unlesbar", font: { size: 15 } },
              xaxis: { title: { text: "Lieferzeit (Tage)" } },
              yaxis: { title: { text: "Anzahl" } },
            }),
          };
        }
        return {
          traces: groups.map(([name, rs], i) => {
            const { xs, ys } = ecdf(rs.map((r) => r.delivery_days));
            return { type: "scatter", mode: "lines", name, x: xs, y: ys,
              line: { color: PALETTE[i % PALETTE.length], width: 2, shape: "hv" } };
          }),
          layout: baseLayout({
            showlegend: true, legend: { orientation: "h", y: 1.12 },
            title: { text: "Dieselben 5 Gruppen als ECDF: jede Kurve bleibt lesbar", font: { size: 15 } },
            xaxis: { title: { text: "Lieferzeit (Tage)" } },
            yaxis: { title: { text: "Anteil ≤ x" }, tickformat: ".0%" },
          }),
        };
      },
    },

    /* ========================================================
       #08 Gruppierter Boxplot
       ======================================================== */
    "08": {
      controls: [
        {
          id: "xvar", type: "select", label: "x-Achse",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        {
          id: "huevar", type: "select", label: "Farbe",
          options: [
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
            { value: "carrier", label: "Carrier" },
          ],
          default: "region",
        },
        { id: "sort", type: "checkbox", label: "Nach Median sortieren", default: true },
      ],

      render(rows, v) {
        const hueGroups = [...TEG_DATA.groupBy(rows, v.huevar).entries()];
        const traces = hueGroups.map(([name, rs], i) => ({
          type: "box", name,
          x: rs.map((r) => r[v.xvar]),
          y: rs.map((r) => r.delivery_days),
          marker: { color: PALETTE[i % PALETTE.length], size: 2 },
          line: { width: 1.3 },
          boxpoints: "outliers",
        }));
        const cats = [...TEG_DATA.groupBy(rows, v.xvar).entries()]
          .map(([name, rs]) => [name, median(rs.map((r) => r.delivery_days))]);
        if (v.sort) cats.sort((a, b) => a[1] - b[1]);
        else cats.sort((a, b) => String(a[0]).localeCompare(b[0]));
        return {
          traces,
          layout: baseLayout({
            boxmode: "group", showlegend: true, legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: GROUP_LABELS[v.xvar] },
                     categoryorder: "array", categoryarray: cats.map(([n]) => n) },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.xvar === v.huevar)
          return "x-Achse und Farbe sind dieselbe Variable — wähle zwei verschiedene Dimensionen, sonst verschenkst du die zweite Achse.";
        if (v.xvar === "carrier")
          return "Innerhalb jedes Carriers liegen alle Regionen gleichauf: Der Carrier-Effekt ist robust, kein regionales Artefakt. Genau solche Wechselwirkungs-Checks sind der Zweck gruppierter Boxplots.";
        return "Zwei kategoriale Dimensionen gleichzeitig: x trennt grob, die Farbe verfeinert. Ab ~5 × 5 Gruppen kippt die Lesbarkeit — dann lieber Facetten.";
      },

      goodBad(rows, mode) {
        const good = mode === "good";
        const hueGroups = [...TEG_DATA.groupBy(rows, "region").entries()];
        const cats = [...TEG_DATA.groupBy(rows, "carrier").entries()]
          .map(([name, rs]) => [name, median(rs.map((r) => r.delivery_days))]);
        if (good) cats.sort((a, b) => a[1] - b[1]);
        else cats.sort((a, b) => String(a[0]).localeCompare(b[0]));
        return {
          traces: hueGroups.map(([name, rs], i) => ({
            type: "box", name,
            x: rs.map((r) => r.carrier), y: rs.map((r) => r.delivery_days),
            marker: { color: good ? PALETTE[i % PALETTE.length] : BAD, size: 2 },
            line: { width: 1.2 }, boxpoints: good ? "outliers" : false,
          })),
          layout: baseLayout({
            boxmode: "group", showlegend: good, legend: { orientation: "h", y: 1.12 },
            title: { text: good
              ? "Sortiert nach Median, Farben unterscheidbar"
              : "Alphabetisch, eine Farbe: das Muster bleibt versteckt", font: { size: 15 } },
            xaxis: { categoryorder: "array", categoryarray: cats.map(([n]) => n) },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #09 Ridgeline Plot
       ======================================================== */
    "09": {
      controls: [
        { id: "bw", type: "range", label: "Bandbreite (× Faustregel)", min: 0.3, max: 3, step: 0.1, default: 1 },
        { id: "overlap", type: "range", label: "Überlappung", min: 1, max: 4, step: 0.25, default: 2.5 },
      ],

      render(rows, v) {
        const byMonth = new Map();
        rows.forEach((r) => {
          const m = monthOf(r.order_date);
          if (!byMonth.has(m)) byMonth.set(m, []);
          byMonth.get(m).push(r.delivery_days);
        });
        const all = TEG_DATA.column(rows, "delivery_days");
        const bw = v.bw * silverman(all);
        const lo = 0, hi = 9;
        const traces = [];
        // Von oben (Dez) nach unten (Jan) zeichnen, damit untere Grate vorn liegen
        for (let m = 11; m >= 0; m--) {
          const { xs, ys } = kde(byMonth.get(m) || [0], bw, 140, lo, hi);
          const peak = Math.max(...ys);
          const scaled = ys.map((y) => m + (y / peak) * v.overlap * 0.55);
          traces.push({
            type: "scatter", mode: "lines", name: MONTHS[m],
            x: [...xs, xs[xs.length - 1], xs[0]],
            y: [...scaled, m, m],
            fill: "toself", fillcolor: PALETTE12[m] + "55",
            line: { color: PALETTE12[m], width: 1.4 },
            hoverinfo: "name",
          });
        }
        return {
          traces,
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 460 : 560,
            xaxis: { title: { text: "Lieferzeit (Tage)" }, range: [lo, hi] },
            yaxis: { tickvals: MONTHS.map((_, i) => i), ticktext: MONTHS, autorange: "reversed" },
          }),
        };
      },

      insight(v) {
        if (v.overlap >= 3.5)
          return "Viel Überlappung = dramatischer Look, aber die Grate verdecken sich gegenseitig. Der Ridgeline-Klassiker: Ästhetik gegen Lesbarkeit abwägen.";
        return "Elf fast identische Grate — und der Dezember schert nach rechts aus. Verschiebungen über geordnete Gruppen sind genau die Stärke des Ridgeline.";
      },

      goodBad(rows, mode) {
        const byMonth = new Map();
        rows.forEach((r) => {
          const m = monthOf(r.order_date);
          if (!byMonth.has(m)) byMonth.set(m, []);
          byMonth.get(m).push(r.delivery_days);
        });
        const bw = silverman(TEG_DATA.column(rows, "delivery_days"));
        if (mode === "bad") {
          const traces = [];
          for (let m = 0; m < 12; m++) {
            const { xs, ys } = kde(byMonth.get(m), bw, 140, 0, 9);
            traces.push({ type: "scatter", mode: "lines", name: MONTHS[m],
              x: xs, y: ys, line: { color: PALETTE12[m], width: 1.5 } });
          }
          return {
            traces,
            layout: baseLayout({
              showlegend: true, legend: { orientation: "h", y: 1.18, font: { size: 10 } },
              title: { text: "12 überlagerte Dichten: Welcher Monat ist welcher?", font: { size: 15 } },
              xaxis: { title: { text: "Lieferzeit (Tage)" } },
              yaxis: { title: { text: "Dichte" } },
            }),
          };
        }
        const traces = [];
        for (let m = 11; m >= 0; m--) {
          const { xs, ys } = kde(byMonth.get(m), bw, 140, 0, 9);
          const peak = Math.max(...ys);
          const scaled = ys.map((y) => m + (y / peak) * 1.4);
          traces.push({ type: "scatter", mode: "lines", name: MONTHS[m],
            x: [...xs, xs[xs.length - 1], xs[0]], y: [...scaled, m, m],
            fill: "toself", fillcolor: PALETTE12[m] + "55",
            line: { color: PALETTE12[m], width: 1.3 }, hoverinfo: "name" });
        }
        return {
          traces,
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 460 : 560,
            title: { text: "Als Ridgeline: Der Dezember springt sofort ins Auge", font: { size: 15 } },
            xaxis: { title: { text: "Lieferzeit (Tage)" }, range: [0, 9] },
            yaxis: { tickvals: MONTHS.map((_, i) => i), ticktext: MONTHS, autorange: "reversed" },
          }),
        };
      },
    },

    /* ========================================================
       #10 Raincloud Plot
       ======================================================== */
    "10": {
      controls: [
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
          ],
          default: "carrier",
        },
        { id: "bw", type: "range", label: "Bandbreite (× Faustregel)", min: 0.3, max: 3, step: 0.1, default: 1 },
        { id: "alpha", type: "range", label: "Punkt-Deckkraft", min: 0.05, max: 0.8, step: 0.05, default: 0.2 },
      ],

      render(rows, v) {
        const all = TEG_DATA.column(rows, "delivery_days");
        const bw = v.bw * silverman(all);
        const traces = [...TEG_DATA.groupBy(rows, v.groupby).entries()]
          .map(([name, rs]) => [name, rs.map((r) => r.delivery_days)])
          .sort((a, b) => median(a[1]) - median(b[1]))
          .map(([name, vals], i) => ({
            type: "violin", name, y: vals, bandwidth: bw,
            side: "positive", width: 1.6,
            points: "all", pointpos: -0.7, jitter: 0.45,
            marker: { color: PALETTE[i % PALETTE.length], size: 2.5, opacity: v.alpha },
            box: { visible: true, width: 0.12 },
            line: { color: PALETTE[i % PALETTE.length], width: 1.4 },
            meanline: { visible: false },
          }));
        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: GROUP_LABELS[v.groupby] } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight() {
        return "Drei Schichten pro Gruppe: die „Wolke“ (Form), die Box (Kennzahlen) und der „Regen“ (alle Rohdaten). Maximal informativ — und maximal abhängig von Bandbreite und Deckkraft.";
      },

      goodBad(rows, mode) {
        const groups = [...TEG_DATA.groupBy(rows, "carrier").entries()]
          .map(([name, rs]) => [name, rs.map((r) => r.delivery_days)])
          .sort((a, b) => median(a[1]) - median(b[1]));
        if (mode === "bad") {
          return {
            traces: [{
              type: "bar",
              x: groups.map(([n]) => n),
              y: groups.map(([, vals]) => mean(vals)),
              error_y: { type: "data", array: groups.map(([, vals]) => sd(vals)), color: "#7f1d1d" },
              marker: { color: BAD },
            }],
            layout: baseLayout({
              title: { text: "„Dynamite-Plot“: Mittelwert + Fehlerbalken — Form und Daten weg", font: { size: 15 } },
              yaxis: { title: { text: "Ø Lieferzeit (Tage)" } },
            }),
          };
        }
        const all = TEG_DATA.column(rows, "delivery_days");
        return {
          traces: groups.map(([name, vals], i) => ({
            type: "violin", name, y: vals, bandwidth: silverman(all),
            side: "positive", width: 1.6, points: "all", pointpos: -0.7, jitter: 0.45,
            marker: { color: PALETTE[i % PALETTE.length], size: 2.5, opacity: 0.18 },
            box: { visible: true, width: 0.12 },
            line: { color: PALETTE[i % PALETTE.length], width: 1.4 },
          })),
          layout: baseLayout({
            title: { text: "Raincloud: Form + Kennzahlen + jede einzelne Bestellung", font: { size: 15 } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #11 Dot Plot mit Konfidenzintervall
       ======================================================== */
    "11": {
      controls: [
        {
          id: "variable", type: "select", label: "Variable",
          options: [
            { value: "delivery_days", label: "Lieferzeit (Tage)" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "delivery_days",
        },
        {
          id: "groupby", type: "select", label: "Gruppieren nach",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        {
          id: "level", type: "select", label: "Konfidenzniveau",
          options: [
            { value: "1.645", label: "90 %" },
            { value: "1.96", label: "95 %" },
            { value: "2.576", label: "99 %" },
          ],
          default: "1.96",
        },
      ],

      render(rows, v) {
        const stats = groupCI(rows, v.groupby, v.variable, Number(v.level));
        return {
          traces: [{
            type: "scatter", mode: "markers",
            x: stats.map((s) => s.mean),
            y: stats.map((s) => s.name),
            error_x: { type: "data", array: stats.map((s) => s.hi - s.mean), color: ACCENT, thickness: 1.6 },
            marker: { color: ACCENT, size: 9 },
            hovertemplate: "%{y}: %{x:.2f}<extra></extra>",
          }],
          layout: baseLayout({
            xaxis: { title: { text: "Ø " + VAR_LABELS[v.variable] } },
            yaxis: { title: { text: "" } },
          }),
        };
      },

      insight(v) {
        if (v.variable === "order_value_eur")
          return "Alle Konfidenzintervalle überlappen deutlich: Beim Bestellwert unterscheiden sich die Gruppen nicht belastbar. Ohne Intervalle hätte man die kleinen Mittelwert-Differenzen leicht überinterpretiert.";
        if (v.groupby === "carrier")
          return "Die Carrier-Intervalle sind schmal und klar getrennt — bei n ≈ 500–2.000 pro Gruppe sind die Mittelwert-Unterschiede hochbelastbar.";
        return "Das Intervall beantwortet die Frage hinter der Frage: Ist der Unterschied echt oder Stichproben-Zufall? Überlappende Intervalle = Vorsicht.";
      },

      goodBad(rows, mode) {
        const stats = groupCI(rows, "carrier", "order_value_eur", 1.96);
        if (mode === "bad") {
          return {
            traces: [{
              type: "bar", x: stats.map((s) => s.name), y: stats.map((s) => s.mean),
              marker: { color: BAD },
              hovertemplate: "%{y:.2f} €<extra></extra>",
            }],
            layout: baseLayout({
              title: { text: "Abgeschnittene Achse: „Hermes-Kunden kaufen mehr!“", font: { size: 15 } },
              yaxis: { title: { text: "Ø Bestellwert (EUR)" }, range: [66, 73] },
            }),
          };
        }
        return {
          traces: [{
            type: "scatter", mode: "markers",
            x: stats.map((s) => s.mean), y: stats.map((s) => s.name),
            error_x: { type: "data", array: stats.map((s) => s.hi - s.mean), color: ACCENT, thickness: 1.6 },
            marker: { color: ACCENT, size: 9 },
          }],
          layout: baseLayout({
            title: { text: "Mit 95 %-Intervallen: alles überlappt — kein echter Unterschied", font: { size: 15 } },
            xaxis: { title: { text: "Ø Bestellwert (EUR)" } },
          }),
        };
      },
    },

    /* ========================================================
       #12 Bar Chart (sortiert)
       ======================================================== */
    "12": {
      controls: [
        {
          id: "metric", type: "select", label: "Metrik",
          options: [
            { value: "count", label: "Anzahl Bestellungen" },
            { value: "revenue", label: "Umsatz (EUR)" },
            { value: "avg", label: "Ø Bestellwert (EUR)" },
          ],
          default: "revenue",
        },
        {
          id: "groupby", type: "select", label: "Kategorie",
          options: [
            { value: "product_category", label: "Produktkategorie" },
            { value: "region", label: "Region" },
            { value: "carrier", label: "Carrier" },
          ],
          default: "product_category",
        },
        { id: "sort", type: "checkbox", label: "Nach Größe sortieren", default: true },
        { id: "horiz", type: "checkbox", label: "Horizontal", default: false },
      ],

      render(rows, v) {
        let agg = [...TEG_DATA.groupBy(rows, v.groupby).entries()].map(([name, rs]) => {
          const sum = rs.reduce((a, r) => a + r.order_value_eur, 0);
          return { name, value: v.metric === "count" ? rs.length
            : v.metric === "revenue" ? Math.round(sum) : sum / rs.length };
        });
        agg.sort(v.sort ? (a, b) => b.value - a.value : (a, b) => a.name.localeCompare(b.name));
        const METRIC_TITLES = { count: "Anzahl Bestellungen", revenue: "Umsatz (EUR)", avg: "Ø Bestellwert (EUR)" };
        return {
          traces: [{
            type: "bar",
            x: v.horiz ? agg.map((a) => a.value) : agg.map((a) => a.name),
            y: v.horiz ? agg.map((a) => a.name).reverse() : agg.map((a) => a.value),
            ...(v.horiz ? { x: agg.map((a) => a.value).reverse(), orientation: "h" } : {}),
            marker: { color: ACCENT },
            hovertemplate: "%{" + (v.horiz ? "x" : "y") + ":,.0f}<extra></extra>",
          }],
          layout: baseLayout({
            xaxis: { title: { text: v.horiz ? METRIC_TITLES[v.metric] : "" } },
            yaxis: { title: { text: v.horiz ? "" : METRIC_TITLES[v.metric] } },
          }),
        };
      },

      insight(v) {
        if (!v.sort)
          return "Alphabetische Reihenfolge beantwortet keine Frage. Sortiert nach Größe wird aus der Liste ein Ranking — und das Auge vergleicht sofort.";
        if (v.metric === "avg")
          return "Ø Bestellwerte liegen überall um 50 € — die Balken starten bei 0, deshalb wirken sie zu Recht fast gleich. Eine abgeschnittene Achse würde hier Unterschiede erfinden.";
        return "Apparel führt beim Umsatz mit gut dem Doppelten von Food. Balkenlänge = Wert funktioniert nur, weil die Achse bei 0 beginnt.";
      },

      goodBad(rows, mode) {
        const agg = [...TEG_DATA.groupBy(rows, "carrier").entries()]
          .map(([name, rs]) => ({ name, value: rs.reduce((a, r) => a + r.order_value_eur, 0) / rs.length }))
          .sort((a, b) => b.value - a.value);
        const good = mode === "good";
        return {
          traces: [{
            type: "bar", x: agg.map((a) => a.name), y: agg.map((a) => a.value),
            marker: { color: good ? ACCENT : BAD },
            hovertemplate: "%{y:.2f} €<extra></extra>",
          }],
          layout: baseLayout({
            title: { text: good
              ? "Achse ab 0: Ø Bestellwerte sind praktisch gleich"
              : "Achse ab 67 €: Dieselben Daten als Drama", font: { size: 15 } },
            yaxis: { title: { text: "Ø Bestellwert (EUR)" }, ...(good ? {} : { range: [67, 71] }) },
          }),
        };
      },
    },

    /* ========================================================
       #14 Scatter + LOESS
       ======================================================== */
    "14": {
      controls: [
        {
          id: "xvar", type: "select", label: "x-Achse",
          options: [
            { value: "day", label: "Tag im Jahr" },
            { value: "order_value_eur", label: "Bestellwert (EUR)" },
          ],
          default: "day",
        },
        { id: "span", type: "range", label: "LOESS-Span", min: 0.05, max: 0.9, step: 0.05, default: 0.3 },
        { id: "points", type: "checkbox", label: "Punkte zeigen", default: true },
      ],

      render(rows, v) {
        const step = Math.max(1, Math.floor(rows.length / 1500));
        const sub = rows.filter((_, i) => i % step === 0);
        const xs = sub.map((r) => v.xvar === "day"
          ? Math.round((Date.parse(r.order_date) - Date.parse("2024-01-01")) / 86400000)
          : r.order_value_eur);
        const ys = sub.map((r) => r.delivery_days);
        const fit = loess(xs, ys, v.span);
        const traces = [];
        if (v.points) {
          traces.push({ type: "scattergl", mode: "markers", name: "Bestellungen",
            x: xs, y: ys, marker: { color: ACCENT, size: 4, opacity: 0.18 }, hoverinfo: "skip" });
        }
        traces.push({ type: "scatter", mode: "lines", name: "LOESS",
          x: fit.xs, y: fit.ys, line: { color: "#be185d", width: 3 } });
        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: v.xvar === "day" ? "Tag im Jahr 2024" : "Bestellwert (EUR)" } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.span <= 0.1)
          return "Kleiner Span = die Kurve jagt jedem Zufallsknick hinterher (Overfitting). Diese Wellen sind Rauschen.";
        if (v.xvar === "day")
          return "Die LOESS-Kurve findet, was im Punktewirrwarr unsichtbar ist: den Anstieg ab Ende November. Glatt genug für den Trend, lokal genug fürs Timing.";
        return "Gegen Bestellwert bleibt die Kurve flach — LOESS bestätigt nichtparametrisch, was r = −0,01 behauptet. Eine flache LOESS ist der ehrlichste „kein Effekt“-Beweis.";
      },

      goodBad(rows, mode) {
        const step = Math.max(1, Math.floor(rows.length / 1500));
        const sub = rows.filter((_, i) => i % step === 0);
        const xs = sub.map((r) => Math.round((Date.parse(r.order_date) - Date.parse("2024-01-01")) / 86400000));
        const ys = sub.map((r) => r.delivery_days);
        const good = mode === "good";
        const fit = loess(xs, ys, good ? 0.3 : 0.05);
        return {
          traces: [
            { type: "scattergl", mode: "markers", x: xs, y: ys,
              marker: { color: "#c9c9d4", size: 4, opacity: 0.25 }, hoverinfo: "skip" },
            { type: "scatter", mode: "lines", x: fit.xs, y: fit.ys,
              line: { color: good ? "#be185d" : BAD, width: 3 } },
          ],
          layout: baseLayout({
            title: { text: good
              ? "Span 0,3: stabiler Trend mit klarem Dezember-Anstieg"
              : "Span 0,05: die Kurve „erklärt“ jeden Zufallsknick", font: { size: 15 } },
            xaxis: { title: { text: "Tag im Jahr 2024" } },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #15 Hexbin / 2D-Histogramm
       ======================================================== */
    "15": {
      controls: [
        { id: "bins", type: "range", label: "Bins pro Achse", min: 10, max: 80, step: 5, default: 35 },
        { id: "points", type: "checkbox", label: "Punkte überlagern", default: false },
      ],

      render(rows, v) {
        const x = rows.map((r) => r.order_value_eur), y = rows.map((r) => r.delivery_days);
        const traces = [{
          type: "histogram2d", x, y, nbinsx: v.bins, nbinsy: v.bins,
          colorscale: "YlGnBu", reversescale: false,
          colorbar: { title: { text: "Anzahl" }, thickness: 12 },
        }];
        if (v.points) {
          traces.push({ type: "scattergl", mode: "markers", x, y,
            marker: { color: "rgba(29,29,41,0.25)", size: 2 }, hoverinfo: "skip" });
        }
        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: "Bestellwert (EUR)" }, range: [0, 320] },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },

      insight(v) {
        if (v.bins >= 65)
          return "Sehr feine Zellen: Die meisten enthalten 0–2 Punkte, die Farbe wird zur Lotterie. Binning braucht genug Punkte pro Zelle.";
        return "Statt 5.000 übereinandergemalter Punkte zählt jede Zelle ehrlich mit. Die Masse liegt bei 20–80 € und 2–4 Tagen — das sieht man hier auf einen Blick.";
      },

      goodBad(rows, mode) {
        const x = rows.map((r) => r.order_value_eur), y = rows.map((r) => r.delivery_days);
        if (mode === "bad") {
          return {
            traces: [{ type: "scattergl", mode: "markers", x, y,
              marker: { color: BAD, size: 6, opacity: 1 }, hoverinfo: "skip" }],
            layout: baseLayout({
              title: { text: "Deckender Scatter: Wo 1 Punkt liegt und wo 100, sieht gleich aus", font: { size: 15 } },
              xaxis: { title: { text: "Bestellwert (EUR)" }, range: [0, 320] },
              yaxis: { title: { text: "Lieferzeit (Tage)" } },
            }),
          };
        }
        return {
          traces: [{ type: "histogram2d", x, y, nbinsx: 35, nbinsy: 35,
            colorscale: "YlGnBu", colorbar: { title: { text: "Anzahl" }, thickness: 12 } }],
          layout: baseLayout({
            title: { text: "Als 2D-Histogramm: Die Dichte wird zur Farbe", font: { size: 15 } },
            xaxis: { title: { text: "Bestellwert (EUR)" }, range: [0, 320] },
            yaxis: { title: { text: "Lieferzeit (Tage)" } },
          }),
        };
      },
    },

    /* ========================================================
       #16 2D Density / Contour
       ======================================================== */
    "16": {
      controls: [
        { id: "ncontours", type: "range", label: "Konturlinien", min: 5, max: 40, step: 1, default: 12 },
        { id: "fill", type: "checkbox", label: "Flächen füllen", default: true },
        { id: "points", type: "checkbox", label: "Punkte zeigen", default: true },
      ],

      render(rows, v) {
        const x = rows.map((r) => r.order_value_eur), y = rows.map((r) => r.delivery_days);
        const traces = [{
          type: "histogram2dcontour", x, y, ncontours: v.ncontours,
          colorscale: "YlGnBu",
          contours: { coloring: v.fill ? "fill" : "lines" },
          line: { width: v.fill ? 0.5 : 1.5 },
          colorbar: { title: { text: "Dichte" }, thickness: 12 },
        }];
        if (v.points) {
          traces.push({ type: "scattergl", mode: "markers", x, y,
            marker: { color: "rgba(29,29,41,0.2)", size: 2 }, hoverinfo: "skip" });
        }
        return {
          traces,
          layout: baseLayout({
            xaxis: { title: { text: "Bestellwert (EUR)" }, range: [0, 250] },
            yaxis: { title: { text: "Lieferzeit (Tage)" }, range: [0, 9] },
          }),
        };
      },

      insight(v) {
        if (v.ncontours >= 30)
          return "Viele Konturen suggerieren Präzision — auch dort, wo kaum Daten liegen. Die äußersten Ringe stehen auf einer Handvoll Punkten.";
        if (!v.points)
          return "Ohne die Punkte wirkt die Dichte wie gemessen statt geschätzt. Punkte einblenden zeigt, wo die Schätzung wirklich Daten unter sich hat.";
        return "Höhenlinien für Daten: Jede Linie umschließt Regionen gleicher Dichte. Gut lesbar bleibt es bei ~10–15 Konturen.";
      },

      goodBad(rows, mode) {
        const x = rows.map((r) => r.order_value_eur), y = rows.map((r) => r.delivery_days);
        const good = mode === "good";
        const traces = [{
          type: "histogram2dcontour", x, y, ncontours: good ? 12 : 38,
          colorscale: good ? "YlGnBu" : "Reds",
          contours: { coloring: "lines" }, line: { width: 1.4 },
          colorbar: { thickness: 12 },
        }];
        if (good) traces.push({ type: "scattergl", mode: "markers", x, y,
          marker: { color: "rgba(29,29,41,0.18)", size: 2 }, hoverinfo: "skip" });
        return {
          traces,
          layout: baseLayout({
            title: { text: good
              ? "Moderate Konturen + Rohpunkte als Realitäts-Check"
              : "38 Konturen ohne Punkte: Scheinpräzision im Datennebel", font: { size: 15 } },
            xaxis: { title: { text: "Bestellwert (EUR)" }, range: [0, 250] },
            yaxis: { title: { text: "Lieferzeit (Tage)" }, range: [0, 9] },
          }),
        };
      },
    },

    /* ========================================================
       #17 Bubble Chart  (Bundesland-Aggregate)
       ======================================================== */
    "17": {
      prepare: () => TEG_DATA.loadGeoOrders().then((d) => { TEG_LABS["17"]._geo = d; }),
      controls: [
        {
          id: "sizevar", type: "select", label: "Blasengröße =",
          options: [
            { value: "revenue_eur", label: "Umsatz (EUR)" },
            { value: "orders", label: "Bestellungen" },
          ],
          default: "revenue_eur",
        },
        {
          id: "sizemode", type: "select", label: "Größe kodiert als",
          options: [
            { value: "area", label: "Fläche (korrekt)" },
            { value: "diameter", label: "Durchmesser (verzerrt)" },
          ],
          default: "area",
        },
        { id: "scale", type: "range", label: "Skalierung", min: 0.5, max: 2.5, step: 0.1, default: 1.2 },
      ],

      render(rows, v) {
        const geo = TEG_LABS["17"]._geo;
        const regions = [...new Set(geo.map((g) => g.region))];
        const maxVal = Math.max(...geo.map((g) => g[v.sizevar]));
        const traces = regions.map((reg, i) => {
          const rs = geo.filter((g) => g.region === reg);
          return {
            type: "scatter", mode: "markers", name: reg,
            x: rs.map((g) => g.population_mio),
            y: rs.map((g) => g.orders),
            text: rs.map((g) => g.state_name),
            marker: {
              color: PALETTE[i % PALETTE.length], opacity: 0.75,
              size: rs.map((g) => g[v.sizevar]),
              sizemode: v.sizemode,
              sizeref: v.sizemode === "area"
                ? (2 * maxVal) / Math.pow(28 * v.scale, 2)
                : maxVal / (28 * v.scale),
              line: { color: "#fff", width: 1 },
            },
            hovertemplate: "%{text}<br>%{x} Mio. Einwohner · %{y} Bestellungen<extra></extra>",
          };
        });
        return {
          traces,
          layout: baseLayout({
            showlegend: true, legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: "Einwohner (Mio.)" } },
            yaxis: { title: { text: "Bestellungen 2024" } },
          }),
        };
      },

      insight(v) {
        if (v.sizemode === "diameter")
          return "Durchmesser-Skalierung: doppelter Wert = doppelter Durchmesser = VIERFACHE Fläche. Das Auge liest Fläche — große Werte werden massiv übertrieben.";
        return "Drei Variablen in einem Plot: Einwohner (x), Bestellungen (y), Umsatz (Größe). Die Punkte folgen der Diagonale — Bestellvolumen skaliert mit Bevölkerung.";
      },

      goodBad(rows, mode) {
        const geo = TEG_LABS["17"]._geo;
        const maxVal = Math.max(...geo.map((g) => g.revenue_eur));
        const good = mode === "good";
        return {
          traces: [{
            type: "scatter", mode: "markers",
            x: geo.map((g) => g.population_mio), y: geo.map((g) => g.orders),
            text: geo.map((g) => g.state_name),
            marker: {
              color: good ? ACCENT : BAD, opacity: 0.7,
              size: geo.map((g) => g.revenue_eur),
              sizemode: good ? "area" : "diameter",
              sizeref: good ? (2 * maxVal) / Math.pow(34, 2) : maxVal / 34,
              line: { color: "#fff", width: 1 },
            },
            hovertemplate: "%{text}<extra></extra>",
          }],
          layout: baseLayout({
            title: { text: good
              ? "Fläche ∝ Umsatz: ehrliche Proportionen"
              : "Durchmesser ∝ Umsatz: NRW wirkt 10× größer statt 3×", font: { size: 15 } },
            xaxis: { title: { text: "Einwohner (Mio.)" } },
            yaxis: { title: { text: "Bestellungen 2024" } },
          }),
        };
      },
    },

    /* ========================================================
       #18 Mosaic Plot
       ======================================================== */
    "18": {
      controls: [
        {
          id: "xvar", type: "select", label: "Breite (x)",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
          ],
          default: "carrier",
        },
        {
          id: "yvar", type: "select", label: "Höhe (Segmente)",
          options: [
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
            { value: "carrier", label: "Carrier" },
          ],
          default: "region",
        },
      ],

      render(rows, v) {
        if (v.xvar === v.yvar) {
          return { traces: [], layout: baseLayout({
            title: { text: "Bitte zwei verschiedene Variablen wählen", font: { size: 15 } } }) };
        }
        const xCats = [...TEG_DATA.groupBy(rows, v.xvar).entries()]
          .sort((a, b) => b[1].length - a[1].length);
        const yNames = [...new Set(rows.map((r) => r[v.yvar]))].sort();
        const n = rows.length;
        let cum = 0;
        const centers = [], widths = [], labels = [];
        const segs = yNames.map(() => []);
        xCats.forEach(([xName, rs]) => {
          const w = rs.length / n;
          centers.push(cum + w / 2); widths.push(w * 0.985);
          labels.push(`${xName}<br>${Math.round(w * 100)} %`);
          const counts = new Map();
          rs.forEach((r) => counts.set(r[v.yvar], (counts.get(r[v.yvar]) || 0) + 1));
          yNames.forEach((yName, yi) => segs[yi].push(100 * (counts.get(yName) || 0) / rs.length));
          cum += w;
        });
        return {
          traces: yNames.map((yName, yi) => ({
            type: "bar", name: yName, x: centers, y: segs[yi], width: widths,
            marker: { color: PALETTE[yi % PALETTE.length], line: { color: "#fff", width: 1 } },
            hovertemplate: yName + ": %{y:.1f} %<extra></extra>",
          })),
          layout: baseLayout({
            barmode: "stack", showlegend: true, legend: { orientation: "h", y: 1.12 },
            xaxis: { tickvals: centers, ticktext: labels, title: { text: GROUP_LABELS[v.xvar] + " (Breite = Anteil)" } },
            yaxis: { title: { text: GROUP_LABELS[v.yvar] + "-Anteile (%)" } },
          }),
        };
      },

      insight(v) {
        if (v.xvar === v.yvar) return "Zwei verschiedene Variablen wählen — sonst gibt es nichts zu kreuzen.";
        return "Lesehilfe: Laufen die Segment-Grenzen waagerecht durch, sind die Variablen unabhängig. Hier ist genau das der Fall — Carrier-Wahl hängt nicht von Region oder Kategorie ab.";
      },

      goodBad(rows, mode) {
        if (mode === "bad") {
          const counts = [...TEG_DATA.groupBy(rows, "carrier").entries()]
            .sort((a, b) => b[1].length - a[1].length);
          const regions = [...new Set(rows.map((r) => r.region))].sort();
          return {
            traces: regions.map((reg, i) => ({
              type: "bar", name: reg,
              x: counts.map(([n]) => n),
              y: counts.map(([, rs]) => rs.filter((r) => r.region === reg).length),
              marker: { color: PALETTE[i % PALETTE.length] },
            })),
            layout: baseLayout({
              barmode: "group", showlegend: true, legend: { orientation: "h", y: 1.12 },
              title: { text: "25 gruppierte Balken: Anteile muss man im Kopf ausrechnen", font: { size: 15 } },
              yaxis: { title: { text: "Anzahl" } },
            }),
          };
        }
        return TEG_LABS["18"].render(rows, { xvar: "carrier", yvar: "region" });
      },
    },

    /* ========================================================
       #29 Sankey / Alluvial
       ======================================================== */
    "29": {
      controls: [
        {
          id: "stages", type: "select", label: "Stufen",
          options: [
            { value: "2", label: "Region → Carrier" },
            { value: "3", label: "Region → Carrier → Kategorie" },
          ],
          default: "2",
        },
        { id: "minflow", type: "range", label: "Mindestfluss (Bestellungen)", min: 0, max: 120, step: 10, default: 30 },
      ],

      render(rows, v) {
        const dims = v.stages === "3"
          ? ["region", "carrier", "product_category"]
          : ["region", "carrier"];
        const nodeNames = [], nodeIdx = new Map();
        dims.forEach((d, di) => {
          [...new Set(rows.map((r) => r[d]))].sort().forEach((name) => {
            nodeIdx.set(di + ":" + name, nodeNames.length);
            nodeNames.push(name);
          });
        });
        const links = new Map();
        rows.forEach((r) => {
          for (let i = 0; i < dims.length - 1; i++) {
            const k = nodeIdx.get(i + ":" + r[dims[i]]) + "→" + nodeIdx.get((i + 1) + ":" + r[dims[i + 1]]);
            links.set(k, (links.get(k) || 0) + 1);
          }
        });
        const src = [], tgt = [], val = [];
        [...links.entries()].forEach(([k, count]) => {
          if (count < v.minflow) return;
          const [s, t] = k.split("→").map(Number);
          src.push(s); tgt.push(t); val.push(count);
        });
        return {
          traces: [{
            type: "sankey",
            node: { label: nodeNames, pad: 12, thickness: 14,
                    color: nodeNames.map((_, i) => PALETTE[i % PALETTE.length]) },
            link: { source: src, target: tgt, value: val,
                    color: "rgba(67,56,202,0.18)" },
          }],
          layout: baseLayout({ margin: { l: 10, r: 10, t: 30, b: 20 } }),
        };
      },

      insight(v) {
        if (v.stages === "3" && v.minflow < 20)
          return "Drei Stufen, alle Flüsse: ein Geflecht aus 100+ Bändern. Der Mindestfluss-Regler ist kein Schummeln — er ist Kuratieren.";
        return "Bandbreite = Bestellvolumen. Gut sichtbar: DHL zieht aus jeder Region den größten Strom (~42 %) — die Flussstruktur ist überall gleich.";
      },

      goodBad(rows, mode) {
        return TEG_LABS["29"].render(rows, mode === "good"
          ? { stages: "2", minflow: 30 }
          : { stages: "3", minflow: 0 });
      },
    },

    /* ========================================================
       #19 Korrelations-Heatmap  (Produkt-Datensatz)
       ======================================================== */
    "19": {
      prepare: () => TEG_DATA.loadProducts().then((d) => { TEG_LABS["19"]._prod = d; }),
      controls: [
        {
          id: "method", type: "select", label: "Methode",
          options: [
            { value: "pearson", label: "Pearson (linear)" },
            { value: "spearman", label: "Spearman (Ränge)" },
          ],
          default: "pearson",
        },
        { id: "values", type: "checkbox", label: "Werte anzeigen", default: true },
        { id: "thresh", type: "range", label: "Nur |r| ≥", min: 0, max: 0.8, step: 0.05, default: 0 },
      ],

      render(rows, v) {
        const prod = TEG_LABS["19"]._prod;
        const feats = Object.keys(FEAT_LABELS);
        const cols = feats.map((f) => {
          const c = prod.map((p) => p[f]);
          return v.method === "spearman" ? rank(c) : c;
        });
        const z = feats.map((_, i) => feats.map((_, j) => {
          const r = pearson(cols[i], cols[j]);
          return Math.abs(r) >= v.thresh ? r : null;
        }));
        return {
          traces: [{
            type: "heatmap", z,
            x: feats.map((f) => FEAT_LABELS[f]), y: feats.map((f) => FEAT_LABELS[f]),
            colorscale: "RdBu", reversescale: true, zmin: -1, zmax: 1,
            text: v.values ? z.map((row) => row.map((r) => r == null ? "" : r.toFixed(2))) : null,
            texttemplate: v.values ? "%{text}" : undefined,
            textfont: { size: 9 },
            colorbar: { thickness: 12 },
            hovertemplate: "%{y} × %{x}: %{z:.2f}<extra></extra>",
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 380 : 500,
            xaxis: { tickangle: -40 },
            margin: { l: 100, r: 20, t: 30, b: 90 },
          }),
        };
      },

      insight(v) {
        if (v.thresh >= 0.4)
          return "Gefiltert auf die starken Beziehungen: der Logistik-Block (Gewicht/Volumen/Versand, r ≈ 0,95) und der Preis-Block (Preis ↔ Marge/Absatz, negativ). Zwei Themen — das ist die Struktur des Datensatzes.";
        if (v.method === "spearman")
          return "Spearman arbeitet auf Rängen und fängt auch monotone, nichtlineare Beziehungen. Weichen Pearson und Spearman stark ab, lohnt der Blick auf den Scatter.";
        return "Eine Zahl pro Paar — mehr nicht. Die Heatmap ist die Landkarte; ob hinter r = 0,67 eine Linie, eine Kurve oder Ausreißer stecken, zeigt erst der Pair Plot (#20).";
      },

      goodBad(rows, mode) {
        const prod = TEG_LABS["19"]._prod;
        const feats = Object.keys(FEAT_LABELS);
        const cols = feats.map((f) => prod.map((p) => p[f]));
        const z = feats.map((_, i) => feats.map((_, j) => pearson(cols[i], cols[j])));
        const good = mode === "good";
        return {
          traces: [{
            type: "heatmap", z,
            x: feats.map((f) => FEAT_LABELS[f]), y: feats.map((f) => FEAT_LABELS[f]),
            ...(good
              ? { colorscale: "RdBu", reversescale: true, zmin: -1, zmax: 1 }
              : { colorscale: "Viridis" }),
            colorbar: { thickness: 12 },
            hovertemplate: "%{y} × %{x}: %{z:.2f}<extra></extra>",
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 380 : 480,
            title: { text: good
              ? "Divergierende Skala um 0: Richtung sofort erkennbar"
              : "Sequentielle Skala: −0,7 und +0,1 sehen ähnlich aus", font: { size: 15 } },
            xaxis: { tickangle: -40 },
            margin: { l: 100, r: 20, t: 50, b: 90 },
          }),
        };
      },
    },

    /* ========================================================
       #20 Pair Plot (SPLOM)  (Produkt-Datensatz)
       ======================================================== */
    "20": {
      prepare: () => TEG_DATA.loadProducts().then((d) => { TEG_LABS["20"]._prod = d; }),
      controls: [
        {
          id: "set", type: "select", label: "Feature-Set",
          options: [
            { value: "price", label: "Preis-Set (Preis, Marge, Absatz, Restock)" },
            { value: "logistics", label: "Logistik-Set (Gewicht, Volumen, Versand, Retouren)" },
          ],
          default: "price",
        },
        { id: "color", type: "checkbox", label: "Nach Kategorie färben", default: true },
        { id: "alpha", type: "range", label: "Deckkraft", min: 0.1, max: 1, step: 0.05, default: 0.45 },
      ],

      render(rows, v) {
        const prod = TEG_LABS["20"]._prod;
        const feats = v.set === "price"
          ? ["price_eur", "margin_pct", "monthly_sales", "restock_days"]
          : ["weight_kg", "volume_l", "shipping_cost_eur", "return_rate_pct"];
        return {
          traces: [{
            type: "splom",
            dimensions: feats.map((f) => ({ label: FEAT_LABELS[f], values: prod.map((p) => p[f]) })),
            marker: {
              color: v.color ? prod.map((p) => catColor(p.category)) : ACCENT,
              size: 4, opacity: v.alpha,
            },
            diagonal: { visible: false }, showupperhalf: false,
            hoverinfo: "skip",
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 400 : 560,
            margin: { l: 55, r: 20, t: 30, b: 55 },
          }),
        };
      },

      insight(v) {
        if (v.set === "logistics")
          return "Gewicht–Volumen–Versandkosten: drei fast deckungsgleiche Beziehungen (r ≈ 0,95). Für ein Modell wäre eine der drei Variablen genug — Multikollinearität auf einen Blick.";
        if (!v.color)
          return "Ohne Färbung wirken manche Muster wie eine Wolke. Schalte die Kategorien an — vieles davon ist Cluster-Struktur, kein Kontinuum.";
        return "Preis ↔ Marge und Preis ↔ Absatz fallen gemeinsam: teure Produkte drehen langsamer und mit weniger Marge. Und die Kategorien bilden sichtbare Inseln.";
      },

      goodBad(rows, mode) {
        const prod = TEG_LABS["20"]._prod;
        const good = mode === "good";
        const feats = good
          ? ["price_eur", "margin_pct", "monthly_sales", "weight_kg"]
          : Object.keys(FEAT_LABELS);
        return {
          traces: [{
            type: "splom",
            dimensions: feats.map((f) => ({ label: good ? FEAT_LABELS[f] : f.slice(0, 6), values: prod.map((p) => p[f]) })),
            marker: { color: good ? prod.map((p) => catColor(p.category)) : BAD,
                      size: good ? 4 : 2, opacity: good ? 0.45 : 0.4 },
            diagonal: { visible: false }, showupperhalf: false,
            hoverinfo: "skip",
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 400 : 560,
            title: { text: good
              ? "4 kuratierte Features: jedes Panel lesbar"
              : "Alle 9 Features: 36 Briefmarken-Panels", font: { size: 15 } },
            margin: { l: 55, r: 20, t: 50, b: 55 },
          }),
        };
      },
    },

    /* ========================================================
       #21 Parallel Coordinates  (Produkt-Datensatz)
       ======================================================== */
    "21": {
      prepare: () => TEG_DATA.loadProducts().then((d) => { TEG_LABS["21"]._prod = d; }),
      controls: [
        {
          id: "colorby", type: "select", label: "Linienfarbe",
          options: [
            { value: "category", label: "Kategorie" },
            { value: "price_eur", label: "Preis" },
            { value: "margin_pct", label: "Marge" },
          ],
          default: "category",
        },
        {
          id: "order", type: "select", label: "Achsen-Reihenfolge",
          options: [
            { value: "thematic", label: "Thematisch gruppiert" },
            { value: "alpha", label: "Alphabetisch" },
          ],
          default: "thematic",
        },
      ],

      render(rows, v) {
        const prod = TEG_LABS["21"]._prod;
        const feats = v.order === "thematic"
          ? ["weight_kg", "volume_l", "shipping_cost_eur", "return_rate_pct", "rating",
             "monthly_sales", "margin_pct", "price_eur", "restock_days"]
          : Object.keys(FEAT_LABELS).sort();
        const colorVals = v.colorby === "category"
          ? prod.map((p) => CATEGORIES.indexOf(p.category))
          : prod.map((p) => p[v.colorby]);
        return {
          traces: [{
            type: "parcoords",
            dimensions: feats.map((f) => ({ label: FEAT_LABELS[f], values: prod.map((p) => p[f]) })),
            line: {
              color: colorVals,
              colorscale: v.colorby === "category"
                ? CATEGORIES.map((c, i) => [i / (CATEGORIES.length - 1), PALETTE[i]])
                : "Viridis",
            },
            labelfont: { size: 10 },
            tickfont: { size: 9 },
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 380 : 480,
            margin: { l: 50, r: 50, t: 60, b: 30 },
          }),
        };
      },

      insight(v) {
        if (v.order === "alpha")
          return "Alphabetische Achsen reißen zusammengehörige Variablen auseinander — die Linien kreuzen wild. Achsen-Reihenfolge ist beim Parallel-Coordinates-Plot die halbe Miete.";
        return "Tipp: Mit der Maus auf einer Achse einen Bereich ziehen (Brushing) — z. B. nur die teuersten Produkte. Benachbarte, korrelierte Achsen erzeugen ruhige, parallele Bänder.";
      },

      goodBad(rows, mode) {
        const prod = TEG_LABS["21"]._prod;
        const good = mode === "good";
        const feats = good
          ? ["weight_kg", "volume_l", "shipping_cost_eur", "return_rate_pct", "rating",
             "monthly_sales", "margin_pct", "price_eur", "restock_days"]
          : Object.keys(FEAT_LABELS).sort();
        return {
          traces: [{
            type: "parcoords",
            dimensions: feats.map((f) => ({ label: FEAT_LABELS[f], values: prod.map((p) => p[f]) })),
            line: good
              ? { color: prod.map((p) => CATEGORIES.indexOf(p.category)),
                  colorscale: CATEGORIES.map((c, i) => [i / (CATEGORIES.length - 1), PALETTE[i]]) }
              : { color: "#b91c1c" },
            labelfont: { size: 10 }, tickfont: { size: 9 },
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 380 : 460,
            title: { text: good
              ? "Gruppierte Achsen + Farbe: Profile werden Bänder"
              : "Alphabetisch + einfarbig: 500 Linien Spaghetti", font: { size: 15 } },
            margin: { l: 50, r: 50, t: 80, b: 30 },
          }),
        };
      },
    },

    /* ========================================================
       #22 PCA Scatter / Biplot  (vorberechnet)
       ======================================================== */
    "22": {
      prepare: () => TEG_DATA.loadProjections().then((d) => { TEG_LABS["22"]._proj = d; }),
      controls: [
        {
          id: "pcs", type: "select", label: "Komponenten",
          options: [
            { value: "12", label: "PC1 × PC2" },
            { value: "23", label: "PC2 × PC3" },
          ],
          default: "12",
        },
        { id: "color", type: "checkbox", label: "Nach Kategorie färben", default: true },
        { id: "loadings", type: "checkbox", label: "Loadings einblenden", default: true },
      ],

      render(rows, v) {
        const proj = TEG_LABS["22"]._proj;
        const p = proj.pca;
        const [xs, ys] = v.pcs === "12" ? [p.x, p.y] : [p.y, p.z];
        const [ei, ej] = v.pcs === "12" ? [0, 1] : [1, 2];
        const traces = [{
          type: "scattergl", mode: "markers",
          x: xs, y: ys,
          marker: { color: v.color ? proj.category.map(catColor) : ACCENT, size: 5, opacity: 0.6 },
          text: proj.category, hovertemplate: "%{text}<extra></extra>",
        }];
        const annotations = [];
        if (v.loadings && v.pcs === "12") {
          Object.entries(p.loadings).forEach(([f, [l1, l2]]) => {
            if (Math.sqrt(l1 * l1 + l2 * l2) < 0.25) return;
            traces.push({ type: "scatter", mode: "lines",
              x: [0, l1 * 5], y: [0, l2 * 5],
              line: { color: "#1d1d29", width: 1.2 }, hoverinfo: "skip" });
            annotations.push({ x: l1 * 5.6, y: l2 * 5.6, text: FEAT_LABELS[f],
              showarrow: false, font: { size: 10, color: "#1d1d29" } });
          });
        }
        return {
          traces,
          layout: baseLayout({
            annotations,
            xaxis: { title: { text: `PC${ei + 1} (${Math.round(p.explained[ei] * 100)} % Varianz)` } },
            yaxis: { title: { text: `PC${ej + 1} (${Math.round(p.explained[ej] * 100)} % Varianz)` } },
          }),
        };
      },

      insight(v) {
        const p = TEG_LABS["22"]._proj.pca;
        const pct = Math.round((p.explained[0] + p.explained[1]) * 100);
        if (v.pcs === "23")
          return "PC2 × PC3 zeigt die Reststruktur — die Cluster sind hier diffuser, weil die Hauptachsen der Varianz fehlen. Immer zuerst die erklärte Varianz lesen.";
        return `PC1 + PC2 erklären zusammen ${pct} % der Varianz. Die Loadings zeigen, was die Achsen bedeuten: PC1 ≈ Logistik (Gewicht/Volumen/Versand), PC2 ≈ Preis-Ökonomie. Die Kategorien trennen sich entlang genau dieser Achsen.`;
      },

      goodBad(rows, mode) {
        const proj = TEG_LABS["22"]._proj;
        const good = mode === "good";
        const p = good ? proj.pca : proj.pca_unscaled;
        return {
          traces: [{
            type: "scattergl", mode: "markers",
            x: p.x, y: p.y,
            marker: { color: proj.category.map(catColor), size: 5, opacity: 0.6 },
            text: proj.category, hovertemplate: "%{text}<extra></extra>",
          }],
          layout: baseLayout({
            title: { text: good
              ? "Skaliert: echte Struktur in allen Variablen"
              : `Unskaliert: ${Math.round(p.explained[0] * 100)} % „Varianz“ = nur ${FEAT_LABELS[proj.pca_unscaled.dominant] || proj.pca_unscaled.dominant}`,
              font: { size: 15 } },
            xaxis: { title: { text: `PC1 (${Math.round(p.explained[0] * 100)} %)` } },
            yaxis: { title: { text: `PC2 (${Math.round(p.explained[1] * 100)} %)` } },
          }),
        };
      },
    },

    /* ========================================================
       #23 t-SNE / UMAP  (vorberechnet)
       ======================================================== */
    "23": {
      prepare: () => TEG_DATA.loadProjections().then((d) => { TEG_LABS["23"]._proj = d; }),
      controls: [
        {
          id: "method", type: "select", label: "Methode",
          options: [
            { value: "tsne:p30", label: "t-SNE (Perplexity 30)" },
            { value: "tsne:p5", label: "t-SNE (Perplexity 5)" },
            { value: "tsne:p80", label: "t-SNE (Perplexity 80)" },
            { value: "umap", label: "UMAP" },
          ],
          default: "tsne:p30",
        },
        { id: "color", type: "checkbox", label: "Nach Kategorie färben", default: true },
      ],

      render(rows, v) {
        const proj = TEG_LABS["23"]._proj;
        const emb = v.method === "umap" ? proj.umap : proj.tsne[v.method.split(":")[1]];
        return {
          traces: [{
            type: "scattergl", mode: "markers",
            x: emb.x, y: emb.y,
            marker: { color: v.color ? proj.category.map(catColor) : ACCENT, size: 5, opacity: 0.7 },
            text: proj.category, hovertemplate: "%{text}<extra></extra>",
          }],
          layout: baseLayout({
            xaxis: { showticklabels: false, title: { text: "Dimension 1 (ohne Einheit)" } },
            yaxis: { showticklabels: false, title: { text: "Dimension 2 (ohne Einheit)" } },
          }),
        };
      },

      insight(v) {
        if (v.method === "tsne:p5")
          return "Perplexity 5: viele kleine Splitter-Cluster — die Methode schaut nur auf die nächsten Nachbarn. Welche Cluster überleben alle Einstellungen? Nur denen darfst du trauen.";
        if (v.method === "tsne:p80")
          return "Perplexity 80: die globalere Sicht zieht die Cluster zusammen. Vergleiche mit Perplexity 5 — die stabilen Strukturen sind die echten.";
        if (v.method === "umap")
          return "UMAP trennt die fünf Kategorien sauber und ist dabei deutlich schneller als t-SNE. Aber dieselbe Regel: Abstände ZWISCHEN Clustern sind nicht interpretierbar.";
        return "Fünf klare Inseln = die fünf Kategorien, gefunden ohne Labels. Aber Vorsicht: Clustergrößen und -abstände in t-SNE bedeuten nichts — nur die Nachbarschaft zählt.";
      },

      goodBad(rows, mode) {
        const proj = TEG_LABS["23"]._proj;
        const emb = proj.tsne.p30;
        const good = mode === "good";
        const traces = [{
          type: "scattergl", mode: "markers",
          x: emb.x, y: emb.y,
          marker: { color: good ? proj.category.map(catColor) : BAD, size: 5, opacity: 0.7 },
          hoverinfo: "skip",
        }];
        if (!good) {
          const fit = loess(emb.x, emb.y, 0.5, 40);
          traces.push({ type: "scatter", mode: "lines", x: fit.xs, y: fit.ys,
            line: { color: "#1d1d29", width: 3, dash: "dash" } });
        }
        return {
          traces,
          layout: baseLayout({
            title: { text: good
              ? "Richtig gelesen: Nachbarschaft ja, Abstände nein"
              : "„Trend“ durchs Embedding gelegt: kompletter Unsinn", font: { size: 15 } },
            xaxis: { showticklabels: !good, title: { text: good ? "Dimension 1 (ohne Einheit)" : "x [?]" } },
            yaxis: { showticklabels: !good, title: { text: good ? "Dimension 2 (ohne Einheit)" : "y [?]" } },
          }),
        };
      },
    },

    /* ========================================================
       #25 Small Multiples
       ======================================================== */
    "25": {
      controls: [
        {
          id: "metric", type: "select", label: "Metrik",
          options: [
            { value: "delivery", label: "Ø Lieferzeit (Tage)" },
            { value: "orders", label: "Bestellungen pro Woche" },
          ],
          default: "delivery",
        },
        { id: "shared", type: "checkbox", label: "Gemeinsame y-Achse", default: true },
      ],

      _weekly(rows, metric) {
        const byCW = new Map();
        rows.forEach((r) => {
          const day = Math.floor((Date.parse(r.order_date) - Date.parse("2024-01-01")) / 86400000);
          const wk = Math.floor(day / 7);
          const k = r.carrier + ":" + wk;
          if (!byCW.has(k)) byCW.set(k, { n: 0, del: 0 });
          const o = byCW.get(k); o.n++; o.del += r.delivery_days;
        });
        const carriers = [...new Set(rows.map((r) => r.carrier))].sort();
        return carriers.map((c) => {
          const xs = [], ys = [];
          for (let wk = 0; wk <= 52; wk++) {
            const o = byCW.get(c + ":" + wk);
            if (!o) continue;
            xs.push(wk);
            ys.push(metric === "orders" ? o.n : o.del / o.n);
          }
          return { carrier: c, xs, ys };
        });
      },

      render(rows, v) {
        const series = TEG_LABS["25"]._weekly(rows, v.metric);
        const allY = series.flatMap((s) => s.ys);
        const yRange = [Math.min(...allY) * 0.95, Math.max(...allY) * 1.05];
        const traces = series.map((s, i) => ({
          type: "scatter", mode: "lines", name: s.carrier,
          x: s.xs, y: s.ys,
          line: { color: PALETTE[i % PALETTE.length], width: 1.6 },
          xaxis: "x" + (i ? i + 1 : ""), yaxis: "y" + (i ? i + 1 : ""),
        }));
        const layout = baseLayout({
          grid: { rows: 2, columns: 3, pattern: "independent" },
          height: (typeof window !== "undefined" && window.innerWidth < 640) ? 420 : 500,
          margin: { l: 40, r: 10, t: 60, b: 40 },
        });
        series.forEach((s, i) => {
          const sfx = i ? i + 1 : "";
          layout["xaxis" + sfx] = { title: { text: s.carrier, font: { size: 12 } } };
          layout["yaxis" + sfx] = v.shared ? { range: yRange } : {};
        });
        return { traces, layout };
      },

      insight(v) {
        if (!v.shared)
          return "Ohne gemeinsame y-Achse zoomt jedes Panel anders — die Kurven sehen ähnlich aus, obwohl die Niveaus weit auseinanderliegen. Geteilte Achsen sind bei Small Multiples fast immer Pflicht.";
        return "Fünf Panels, eine Skala: Hermes liegt durchgehend höher, und der Dezember-Buckel zeigt sich bei jedem Carrier. Vergleichbarkeit kommt von der gemeinsamen Achse.";
      },

      goodBad(rows, mode) {
        const series = TEG_LABS["25"]._weekly(rows, "delivery");
        if (mode === "bad") {
          return {
            traces: series.map((s, i) => ({
              type: "scatter", mode: "lines", name: s.carrier,
              x: s.xs, y: s.ys, line: { color: PALETTE[i % PALETTE.length], width: 1.4 },
            })),
            layout: baseLayout({
              showlegend: true, legend: { orientation: "h", y: 1.14 },
              title: { text: "Spaghetti: 5 Linien kreuzen sich 200-mal", font: { size: 15 } },
              xaxis: { title: { text: "Kalenderwoche" } },
              yaxis: { title: { text: "Ø Lieferzeit (Tage)" } },
            }),
          };
        }
        return TEG_LABS["25"].render(rows, { metric: "delivery", shared: true });
      },
    },

    /* ========================================================
       #26 Heatmap-Kalender
       ======================================================== */
    "26": {
      controls: [
        {
          id: "metric", type: "select", label: "Metrik",
          options: [
            { value: "delivery", label: "Ø Lieferzeit (Tage)" },
            { value: "orders", label: "Bestellungen pro Tag" },
          ],
          default: "delivery",
        },
        { id: "robust", type: "checkbox", label: "Farbskala robust begrenzen (P5–P95)", default: true },
      ],

      _matrix(rows, metric) {
        const daily = new Map();
        rows.forEach((r) => {
          if (!daily.has(r.order_date)) daily.set(r.order_date, { n: 0, del: 0 });
          const o = daily.get(r.order_date); o.n++; o.del += r.delivery_days;
        });
        // 2024-01-01 ist ein Montag → Woche/Wochentag direkt aus dem Jahrtag
        const z = WEEKDAYS.map(() => new Array(53).fill(null));
        const vals = [];
        daily.forEach((o, date) => {
          const day = Math.round((Date.parse(date) - Date.parse("2024-01-01")) / 86400000);
          const v = metric === "orders" ? o.n : o.del / o.n;
          z[day % 7][Math.floor(day / 7)] = v;
          vals.push(v);
        });
        return { z, vals };
      },

      render(rows, v) {
        const { z, vals } = TEG_LABS["26"]._matrix(rows, v.metric);
        const sorted = [...vals].sort((a, b) => a - b);
        const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
        const monthTicks = [0, 4.4, 8.7, 13, 17.4, 21.7, 26, 30.4, 34.8, 39, 43.4, 47.8];
        return {
          traces: [{
            type: "heatmap", z, y: WEEKDAYS,
            colorscale: "YlGnBu",
            ...(v.robust ? { zmin: q(0.05), zmax: q(0.95) } : {}),
            colorbar: { thickness: 12,
              title: { text: v.metric === "orders" ? "Bestellungen" : "Ø Tage" } },
            hovertemplate: "KW %{x}: %{z:.1f}<extra></extra>",
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 260 : 320,
            xaxis: { tickvals: monthTicks, ticktext: MONTHS, title: { text: "" } },
            yaxis: { autorange: "reversed" },
            margin: { l: 40, r: 20, t: 30, b: 40 },
          }),
        };
      },

      insight(v) {
        if (v.metric === "orders")
          return "Kein Wochentags- oder Saisonmuster — das Bestellvolumen ist gleichmäßiges Rauschen um ~14/Tag. Ein leerer Kalender ist auch ein Ergebnis (und schützt vor erfundenen Mustern).";
        return "Der Dezember leuchtet als zusammenhängender Block — kein einzelner Ausreißer-Tag, sondern ein struktureller Zeitraum. Genau diese Tag-für-Tag-Sicht kann keine Linie liefern.";
      },

      goodBad(rows, mode) {
        const good = mode === "good";
        const { z, vals } = TEG_LABS["26"]._matrix(rows, good ? "delivery" : "orders");
        const sorted = [...vals].sort((a, b) => a - b);
        const q = (p) => sorted[Math.floor(p * (sorted.length - 1))];
        const monthTicks = [0, 4.4, 8.7, 13, 17.4, 21.7, 26, 30.4, 34.8, 39, 43.4, 47.8];
        return {
          traces: [{
            type: "heatmap", z, y: WEEKDAYS,
            colorscale: good ? "YlGnBu" : "Reds",
            ...(good ? { zmin: q(0.05), zmax: q(0.95) } : {}),
            colorbar: { thickness: 12 },
          }],
          layout: baseLayout({
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 280 : 330,
            title: { text: good
              ? "Ø Lieferzeit: Der Dezember-Block ist echtes Signal"
              : "Bestellungen, Min-Max-Skala: Rauschen sieht aus wie Muster", font: { size: 15 } },
            xaxis: { tickvals: monthTicks, ticktext: MONTHS },
            yaxis: { autorange: "reversed" },
            margin: { l: 40, r: 20, t: 50, b: 40 },
          }),
        };
      },
    },

    /* ========================================================
       #27 Stacked Bar (100 %)
       ======================================================== */
    "27": {
      controls: [
        {
          id: "xvar", type: "select", label: "x-Achse",
          options: [
            { value: "region", label: "Region" },
            { value: "product_category", label: "Produktkategorie" },
            { value: "month", label: "Monat" },
          ],
          default: "product_category",
        },
        {
          id: "segvar", type: "select", label: "Segmente",
          options: [
            { value: "carrier", label: "Carrier" },
            { value: "region", label: "Region" },
          ],
          default: "carrier",
        },
        {
          id: "mode", type: "select", label: "Modus",
          options: [
            { value: "percent", label: "100 % (Anteile)" },
            { value: "absolute", label: "Absolut (Anzahl)" },
          ],
          default: "percent",
        },
      ],

      render(rows, v) {
        const xOf = (r) => v.xvar === "month" ? MONTHS[monthOf(r.order_date)] : r[v.xvar];
        const xCats = v.xvar === "month" ? MONTHS : [...new Set(rows.map(xOf))].sort();
        const segs = [...new Set(rows.map((r) => r[v.segvar]))].sort();
        const counts = new Map();
        rows.forEach((r) => {
          const k = xOf(r) + "|" + r[v.segvar];
          counts.set(k, (counts.get(k) || 0) + 1);
        });
        const totals = xCats.map((x) => segs.reduce((a, s) => a + (counts.get(x + "|" + s) || 0), 0));
        return {
          traces: segs.map((s, i) => ({
            type: "bar", name: s, x: xCats,
            y: xCats.map((x, xi) => {
              const c = counts.get(x + "|" + s) || 0;
              return v.mode === "percent" ? (100 * c) / (totals[xi] || 1) : c;
            }),
            marker: { color: PALETTE[i % PALETTE.length] },
            hovertemplate: s + ": %{y:.1f}" + (v.mode === "percent" ? " %" : "") + "<extra></extra>",
          })),
          layout: baseLayout({
            barmode: "stack", showlegend: true, legend: { orientation: "h", y: 1.12 },
            xaxis: { title: { text: v.xvar === "month" ? "Monat" : GROUP_LABELS[v.xvar] } },
            yaxis: { title: { text: v.mode === "percent" ? "Anteil (%)" : "Bestellungen" },
                     ...(v.mode === "percent" ? { range: [0, 100] } : {}) },
          }),
        };
      },

      insight(v) {
        if (v.mode === "percent")
          return "Die Carrier-Anteile sind über alle Gruppen hinweg fast identisch (DHL ~42 %) — Stabilität ist hier der Befund. Aber Achtung: 100 %-Balken verschweigen, dass die Gruppen verschieden groß sind.";
        return "Absolut gestapelt: Jetzt sieht man die Gesamtmengen — aber Anteile lassen sich nur noch für das unterste Segment sauber vergleichen (gemeinsame Basislinie!).";
      },

      goodBad(rows, mode) {
        if (mode === "bad") {
          const r = TEG_LABS["27"].render(rows, { xvar: "product_category", segvar: "carrier", mode: "percent" });
          r.layout.title = { text: "100 %-Balken: Dass Apparel 2,4× so viel Umsatz hat wie Food? Unsichtbar.", font: { size: 14 } };
          return r;
        }
        const r = TEG_LABS["27"].render(rows, { xvar: "product_category", segvar: "carrier", mode: "absolute" });
        r.layout.title = { text: "Absolut: Anteile UND Größenverhältnisse bleiben sichtbar", font: { size: 15 } };
        return r;
      },
    },

    /* ========================================================
       #28 Treemap
       ======================================================== */
    "28": {
      controls: [
        {
          id: "hierarchy", type: "select", label: "Hierarchie",
          options: [
            { value: "cat-region", label: "Kategorie → Region" },
            { value: "region-cat", label: "Region → Kategorie" },
          ],
          default: "cat-region",
        },
        {
          id: "metric", type: "select", label: "Fläche =",
          options: [
            { value: "revenue", label: "Umsatz (EUR)" },
            { value: "orders", label: "Bestellungen" },
          ],
          default: "revenue",
        },
      ],

      _tree(rows, v) {
        const [lvl1, lvl2] = v.hierarchy === "cat-region"
          ? ["product_category", "region"] : ["region", "product_category"];
        const ids = [], labels = [], parents = [], values = [];
        const l1 = TEG_DATA.groupBy(rows, lvl1);
        [...l1.entries()].forEach(([n1, rs1]) => {
          ids.push(n1); labels.push(n1); parents.push("");
          values.push(v.metric === "orders" ? rs1.length
            : Math.round(rs1.reduce((a, r) => a + r.order_value_eur, 0)));
          [...TEG_DATA.groupBy(rs1, lvl2).entries()].forEach(([n2, rs2]) => {
            ids.push(n1 + "/" + n2); labels.push(n2); parents.push(n1);
            values.push(v.metric === "orders" ? rs2.length
              : Math.round(rs2.reduce((a, r) => a + r.order_value_eur, 0)));
          });
        });
        return { ids, labels, parents, values };
      },

      render(rows, v) {
        const t = TEG_LABS["28"]._tree(rows, v);
        return {
          traces: [{
            type: "treemap", ids: t.ids, labels: t.labels, parents: t.parents,
            values: t.values, branchvalues: "total",
            marker: { colors: t.parents.map((p, i) =>
              p === "" ? PALETTE[i % PALETTE.length] : null), line: { width: 1.5, color: "#fff" } },
            textinfo: "label+percent root",
            hovertemplate: "%{label}: %{value:,.0f}<extra></extra>",
          }],
          layout: baseLayout({ margin: { l: 10, r: 10, t: 30, b: 10 } }),
        };
      },

      insight(v) {
        if (v.hierarchy === "region-cat")
          return "Hierarchie umgedreht: Jetzt fragt die Grafik „Wie setzt sich jede Region zusammen?“ statt „Wo verkauft jede Kategorie?“. Die Reihenfolge der Ebenen IST die Fragestellung.";
        return "Fläche = Umsatz, verschachtelt nach Kategorie → Region. Apparel dominiert sichtbar. Klick auf eine Kachel zoomt hinein. Für exakte Vergleiche ähnlicher Flächen taugt das Auge allerdings nicht — dann Bar Chart (#12).";
      },

      goodBad(rows, mode) {
        if (mode === "bad") {
          const byCombo = [];
          TEG_DATA.groupBy(rows, "product_category").forEach((rs1, n1) => {
            TEG_DATA.groupBy(rs1, "region").forEach((rs2, n2) => {
              byCombo.push({ label: n1 + " · " + n2,
                value: Math.round(rs2.reduce((a, r) => a + r.order_value_eur, 0)) });
            });
          });
          return {
            traces: [{
              type: "pie", labels: byCombo.map((c) => c.label), values: byCombo.map((c) => c.value),
              textinfo: "none", hovertemplate: "%{label}: %{value:,.0f} €<extra></extra>",
              marker: { line: { color: "#fff", width: 1 } },
            }],
            layout: baseLayout({
              showlegend: false,
              title: { text: "25 Tortenstücke: Winkel vergleichen kann kein Mensch", font: { size: 15 } },
              margin: { l: 10, r: 10, t: 50, b: 10 },
            }),
          };
        }
        const r = TEG_LABS["28"].render(rows, { hierarchy: "cat-region", metric: "revenue" });
        r.layout.title = { text: "Als Treemap: Hierarchie + Größe auf einen Blick", font: { size: 15 } };
        return r;
      },
    },

    /* ========================================================
       #30 Choropleth Map  (Bundesländer)
       ======================================================== */
    "30": {
      prepare: () => Promise.all([TEG_DATA.loadGeoOrders(), TEG_DATA.loadGeoJSON()])
        .then(([geo, gj]) => { TEG_LABS["30"]._geo = geo; TEG_LABS["30"]._geojson = gj; }),
      controls: [
        {
          id: "metric", type: "select", label: "Metrik",
          options: [
            { value: "orders_per_100k", label: "Bestellungen pro 100k Einwohner" },
            { value: "orders", label: "Bestellungen (absolut)" },
            { value: "revenue_eur", label: "Umsatz (EUR, absolut)" },
          ],
          default: "orders_per_100k",
        },
      ],

      render(rows, v) {
        const geo = TEG_LABS["30"]._geo;
        const TITLES = { orders_per_100k: "Bestellungen / 100k Einw.",
                         orders: "Bestellungen", revenue_eur: "Umsatz (EUR)" };
        return {
          traces: [{
            type: "choropleth",
            geojson: TEG_LABS["30"]._geojson,
            featureidkey: "properties.id",
            locations: geo.map((g) => g.state_id),
            z: geo.map((g) => g[v.metric]),
            text: geo.map((g) => g.state_name),
            colorscale: "YlGnBu",
            colorbar: { thickness: 12, title: { text: TITLES[v.metric] } },
            marker: { line: { color: "#fff", width: 0.8 } },
            hovertemplate: "%{text}: %{z:,.1f}<extra></extra>",
          }],
          layout: baseLayout({
            geo: { fitbounds: "locations", visible: false, bgcolor: "rgba(0,0,0,0)" },
            height: (typeof window !== "undefined" && window.innerWidth < 640) ? 400 : 520,
            margin: { l: 10, r: 10, t: 30, b: 10 },
          }),
        };
      },

      insight(v) {
        if (v.metric === "orders_per_100k")
          return "Pro Kopf normiert dreht sich die Karte: Hessen führt deutlich, die bevölkerungsreichen Flächenländer fallen zurück. Absolutwerte auf Karten zeigen meist nur, wo viele Menschen wohnen.";
        return "NRW und Bayern dominieren — aber das tun sie bei fast jeder absoluten Kennzahl, weil dort die meisten Menschen leben. Schalte auf „pro 100k“ um und vergleiche.";
      },

      goodBad(rows, mode) {
        const r = TEG_LABS["30"].render(rows,
          { metric: mode === "good" ? "orders_per_100k" : "orders" });
        r.layout.title = { text: mode === "good"
          ? "Pro 100k Einwohner: das ehrliche Bild"
          : "Absolutwerte: eine Bevölkerungskarte in Verkleidung", font: { size: 15 } };
        if (mode === "bad") r.traces[0].colorscale = "Reds";
        return r;
      },
    },
  };
})();
