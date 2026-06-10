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
  };
})();
