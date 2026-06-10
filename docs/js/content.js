/* ============================================================
   content.js — Inhalte aller 30 Module.
   Ein Modul = ein Eintrag. `available: true` schaltet es im
   Lernpfad frei; das Parameter-Labor dazu liegt in labs.js.
   ============================================================ */

const TEG_CLUSTERS = [
  {
    num: 1,
    name: "Fundament",
    desc: "Das Brot-und-Butter-Set, das in 70 % aller EDA-Situationen reicht.",
    modules: ["01", "03", "13", "24"],
  },
  {
    num: 2,
    name: "Verteilungen & Gruppen",
    desc: "Was hinter dem Boxplot steckt — und wie man Gruppen ehrlich vergleicht.",
    modules: ["02", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
  },
  {
    num: 3,
    name: "Beziehungen",
    desc: "Zusammenhänge zwischen zwei Variablen — Trends, Dichte, Flüsse.",
    modules: ["14", "15", "16", "17", "18", "29"],
  },
  {
    num: 4,
    name: "Hochdimensional",
    desc: "Viele Variablen auf einmal — die Brücke zu Machine-Learning-Datensätzen.",
    modules: ["19", "20", "21", "22", "23"],
  },
  {
    num: 5,
    name: "Storytelling",
    desc: "Zeit, Anteile, Karten — Grafiken für Präsentationen mit Aussage.",
    modules: ["25", "26", "27", "28", "30"],
  },
];

const TEG_MODULES = {
  /* ==========================================================
     #01 Histogramm — vollständig ausgearbeitet (M0-Durchstich)
     ========================================================== */
  "01": {
    title: "Histogramm",
    question: "Wie ist eine einzelne numerische Variable verteilt — symmetrisch, schief, mehrgipflig?",
    available: true,
    useWhen: "Erster Blick auf jede numerische Variable: Form, Lage, Streuung, Ausreißer. Das Standardwerkzeug am Anfang jeder EDA.",
    useNot: "Bei sehr wenigen Beobachtungen (< 30) oder wenn du mehrere Gruppen präzise vergleichen willst — dann Strip Plot, ECDF oder Density.",
    labIntro: "Spiel mit der Bin-Anzahl und der Skala: Dieselben 5.000 Lieferzeiten und Bestellwerte können harmlos oder dramatisch aussehen — je nachdem, wie du sie schneidest.",
    goodBad: {
      intro: "Dieselben Daten (Bestellwerte), zweimal dargestellt:",
      goodLabel: "Aussagekräftig",
      badLabel: "Irreführend",
      goodExplain: "≈ 50 Bins zeigen die wahre Form: stark rechtsschief, Median um 50 €, ein langer Schwanz mit Ausreißern bis fast 1.800 €. Genau diese Form entscheidet später über Median vs. Mittelwert, log-Transformation und Ausreißer-Behandlung.",
      badExplain: "Mit nur 5 Bins wirkt die Verteilung wie ein harmloser Abfall — der lange Schwanz und die Ausreißer verschwinden komplett im letzten Balken. Wer hiernach den Mittelwert (69 €) als „typischen Bestellwert“ berichtet, liegt 40 % über dem Median.",
    },
    snippets: {
      minimal:
`import seaborn as sns

sns.histplot(df["delivery_days"], bins=40)`,
      elegant:
`import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(9, 5))
sns.histplot(df["delivery_days"], bins=40, color="#4338ca", ax=ax)

ax.set_title("Die meisten Pakete kommen in 2–4 Tagen — aber nicht alle")
ax.set_xlabel("Lieferzeit (Tage)")
ax.set_ylabel("Anzahl Bestellungen")
sns.despine()
fig.tight_layout()`,
    },
    merksatz: "Ein Histogramm ohne Bin-Experiment ist keine Analyse, sondern ein Zufallsergebnis.",
    pitfalls: [
      ["Zu wenige Bins", "Verdeckt Schiefe, Mehrgipfligkeit und Ausreißer — die Form wird glattgebügelt.", "Immer 2–3 Bin-Breiten testen (z. B. 10 / 40 / 100)."],
      ["Zu viele Bins", "Jeder Balken wird zum Rauschen, die Form zerfällt.", "Faustregel als Start: √n oder Freedman-Diaconis, dann justieren."],
      ["Schiefe ignoriert", "Bei rechtsschiefen Daten dominiert der lange Schwanz die x-Achse — 95 % der Daten quetschen sich links.", "log-Skala testen; wenn die Verteilung dann symmetrisch wird, ist das selbst ein Befund."],
      ["Gruppen übereinander gelegt", "Überlappende Histogramme sind ab 3 Gruppen unlesbar.", "Density Plot (#02), ECDF (#07) oder Facetten verwenden."],
    ],
    quiz: [
      {
        q: "Du betrachtest die Bestellwerte mit 5 Bins und siehst „einen einfachen Abfall“. Was ist die größte Gefahr?",
        options: [
          "Die Form der Verteilung (Schiefe, Schwanz, Ausreißer) bleibt unsichtbar — Entscheidungen basieren auf einem Artefakt.",
          "Das Histogramm ist mathematisch falsch berechnet.",
          "5 Bins sind immer korrekt, solange n > 1.000 ist.",
        ],
        correct: 0,
        explain: "Die Bin-Anzahl ist ein freier Parameter — und mit 5 Bins verschwindet der lange rechte Schwanz der Bestellwerte komplett im letzten Balken. Erst ab ~30–50 Bins zeigt sich die wahre, stark rechtsschiefe Form.",
      },
      {
        q: "Wann ist die log-Skala auf der x-Achse sinnvoll?",
        options: [
          "Immer — sie sieht professioneller aus.",
          "Bei stark rechtsschiefen Daten, deren Werte sich über mehrere Größenordnungen erstrecken.",
          "Nie — sie verzerrt die Daten.",
        ],
        correct: 1,
        explain: "Bestellwerte von 5 € bis 1.778 € erstrecken sich über fast drei Größenordnungen. Auf der log-Skala wird die Verteilung nahezu symmetrisch — ein Hinweis auf eine Log-Normalverteilung, was z. B. für Modellierung extrem nützlich ist. Wichtig: Die Achse muss klar als logarithmisch beschriftet sein.",
      },
      {
        q: "Histogramm oder Boxplot — wann gewinnt das Histogramm?",
        options: [
          "Wenn ich viele Gruppen nebeneinander vergleichen will.",
          "Wenn mich Median und Quartile interessieren.",
          "Wenn mich die Form interessiert — etwa ob die Verteilung zwei Gipfel hat.",
        ],
        correct: 2,
        explain: "Der Boxplot reduziert auf 5 Kennzahlen und kann Mehrgipfligkeit prinzipiell nicht zeigen — zwei völlig verschiedene Verteilungen können identische Boxplots haben. Das Histogramm zeigt die Form.",
      },
    ],
  },

  /* ---- Stubs: werden in M1–M5 ausgearbeitet ---- */
  "02": { title: "Density Plot (KDE)", question: "Wie sieht die geglättete Verteilung aus?", available: false },
  "03": { title: "Boxplot", question: "Median, Quartile, Ausreißer auf einen Blick?", available: false },
  "04": { title: "Violin Plot", question: "Wie unterscheidet sich die Verteilungsform pro Gruppe?", available: false },
  "05": { title: "Strip / Jitter Plot", question: "Wie streuen einzelne Punkte?", available: false },
  "06": { title: "Beeswarm Plot", question: "Wie verteilt sich jede einzelne Beobachtung?", available: false },
  "07": { title: "ECDF Plot", question: "Welcher Anteil der Daten liegt unter Wert x?", available: false },
  "08": { title: "Gruppierter Boxplot", question: "Wie unterscheiden sich Gruppen statistisch?", available: false },
  "09": { title: "Ridgeline Plot", question: "Wie verändert sich die Verteilung über Gruppen?", available: false },
  "10": { title: "Raincloud Plot", question: "Form + Statistik + Rohdaten zugleich?", available: false },
  "11": { title: "Dot Plot mit CI", question: "Wie unterscheiden sich Gruppen-Mittelwerte?", available: false },
  "12": { title: "Bar Chart (sortiert)", question: "Wie groß ist Wert X pro Kategorie?", available: false },
  "13": { title: "Scatter Plot", question: "Wie hängen zwei Variablen zusammen?", available: false },
  "14": { title: "Scatter + LOESS", question: "Welcher Trend liegt im Streudiagramm?", available: false },
  "15": { title: "Hexbin Plot", question: "Wo häufen sich Punkte bei großen Datenmengen?", available: false },
  "16": { title: "2D Density / Contour", question: "Wie liegt die gemeinsame Dichte zweier Variablen?", available: false },
  "17": { title: "Bubble Chart", question: "Drei Variablen: x, y und Größe?", available: false },
  "18": { title: "Mosaic Plot", question: "Wie hängen zwei kategoriale Variablen zusammen?", available: false },
  "19": { title: "Korrelations-Heatmap", question: "Was korreliert mit was?", available: false },
  "20": { title: "Pair Plot", question: "Alle paarweisen Beziehungen auf einen Blick?", available: false },
  "21": { title: "Parallel Coordinates", question: "Gruppen-Muster über viele Dimensionen?", available: false },
  "22": { title: "PCA Scatter / Biplot", question: "Wie strukturieren sich hochdimensionale Daten?", available: false },
  "23": { title: "t-SNE / UMAP Plot", question: "Welche nichtlinearen Cluster gibt es?", available: false },
  "24": { title: "Line Chart", question: "Wie entwickelt sich eine Größe über die Zeit?", available: false },
  "25": { title: "Small Multiples", question: "Wie sieht der Trend pro Gruppe aus?", available: false },
  "26": { title: "Heatmap-Kalender", question: "Welche Tage und Wochen sind hoch oder niedrig?", available: false },
  "27": { title: "Stacked Bar (100 %)", question: "Wie verteilen sich Anteile pro Gruppe?", available: false },
  "28": { title: "Treemap", question: "Wie groß sind verschachtelte Anteile?", available: false },
  "29": { title: "Sankey / Alluvial", question: "Wie fließen Größen zwischen Kategorien?", available: false },
  "30": { title: "Choropleth Map", question: "Wie verteilt sich ein Wert geografisch?", available: false },
};

// Flache Pfad-Reihenfolge (für Vor/Zurück-Navigation)
const TEG_PATH_ORDER = TEG_CLUSTERS.flatMap((c) => c.modules);
