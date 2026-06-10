/* ============================================================
   labs.js — die interaktiven Parameter-Labore (Plotly-Configs).
   Ein Eintrag pro Modul: Controls + render(rows, values).
   render() liefert { traces, layout } für Plotly.react.
   ============================================================ */

const TEG_LABS = (() => {
  const ACCENT = "#4338ca";
  const BAD = "#b91c1c";

  function baseLayout(overrides = {}) {
    return Object.assign({
      font: { family: "Inter, system-ui, sans-serif", size: 13, color: "#1d1d29" },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 60, r: 20, t: 48, b: 52 },
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
  };
})();
