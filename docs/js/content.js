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
    merksatz: "Ein Histogramm ohne Bin-Experiment ist keine Analyse, sondern ein Zufallsergebnis.",
    pitfalls: [
      ["Zu wenige Bins", "Verdeckt Schiefe, Mehrgipfligkeit und Ausreißer — die Form wird glattgebügelt.", "Immer 2–3 Bin-Breiten testen (z. B. 10 / 40 / 100)."],
      ["Zu viele Bins", "Jeder Balken wird zum Rauschen, die Form zerfällt.", "Faustregel als Start: √n oder Freedman-Diaconis, dann justieren."],
      ["Schiefe ignoriert", "Bei rechtsschiefen Daten dominiert der lange Schwanz die x-Achse — 95 % der Daten quetschen sich links.", "log-Skala testen; wenn die Verteilung dann symmetrisch wird, ist das selbst ein Befund."],
      ["Gruppen übereinander gelegt", "Überlappende Histogramme sind ab 3 Gruppen unlesbar.", "Density Plot (#02), ECDF (#07) oder Facetten verwenden."],
    ],
  },

  /* ---- Stubs: werden in M1–M5 ausgearbeitet ---- */
  "02": { title: "Density Plot (KDE)", question: "Wie sieht die geglättete Verteilung aus?", available: false },
  /* ==========================================================
     #03 Boxplot
     ========================================================== */
  "03": {
    title: "Boxplot",
    question: "Wo liegen Median, Quartile und Ausreißer — und wie unterscheiden sich Gruppen?",
    available: true,
    useWhen: "Lage und Streuung mehrerer Gruppen kompakt vergleichen — fünf Kennzahlen pro Gruppe, beliebig viele Gruppen nebeneinander.",
    useNot: "Wenn die Form der Verteilung zählt (Mehrgipfligkeit ist im Boxplot unsichtbar) oder bei sehr kleinen Gruppen — dann Punkte zeigen (Strip Plot).",
    labIntro: "Vergleiche Lieferzeiten über Carrier, Regionen und Kategorien. Die Boxen sind nach Median sortiert — und manche Gruppierung zeigt: Es gibt nichts zu sehen.",
    goodBad: {
      intro: "Dieselbe Frage — „Wie schnell liefern die Carrier?“ — zweimal beantwortet:",
      goodLabel: "Verteilung zeigen",
      badLabel: "Nur Mittelwerte",
      goodExplain: "Die Boxplots zeigen das volle Bild: Die Verteilungen überlappen stark, und Hermes hat einen langen oberen Schwanz — 7,5 % der Sendungen brauchen über 7 Tage. Das eigentliche Problem ist nicht der Durchschnitt, sondern die Unzuverlässigkeit.",
      badExplain: "Mittelwert-Balken (UPS 2,5 vs. Hermes 4,4 Tage) verschweigen alles Wichtige: Wie stark streuen die Lieferzeiten? Überlappen sich die Carrier? Gibt es Extremfälle? Der Hermes-Mittelwert wird vom langen Schwanz nach oben gezogen — die typische Hermes-Sendung ist deutlich schneller.",
    },
    merksatz: "Ein Boxplot ist eine Zusammenfassung — fünf Zahlen sind keine Verteilung.",
    pitfalls: [
      ["Form bleibt unsichtbar", "Zwei völlig verschiedene Verteilungen (z. B. zweigipflig vs. symmetrisch) können identische Boxplots haben.", "Bei wichtigen Variablen zusätzlich Histogramm (#01) oder Violin (#04) prüfen."],
      ["Kleine Gruppen wirken solide", "Eine Box über 15 Werten sieht genauso vertrauenswürdig aus wie eine über 1.500.", "Punkte einblenden oder n pro Gruppe annotieren."],
      ["„Ausreißer“ wörtlich nehmen", "Die 1,5×IQR-Regel ist eine Konvention, kein Fehlerdetektor — bei schiefen Daten markiert sie massenhaft normale Werte.", "Schiefe zuerst prüfen (log-Skala testen), Ausreißer fachlich bewerten."],
      ["Unsortierte Gruppen", "Alphabetische Reihenfolge versteckt das Muster.", "Nach Median sortieren — Unterschiede springen sofort ins Auge."],
    ],
  },
  "04": { title: "Violin Plot", question: "Wie unterscheidet sich die Verteilungsform pro Gruppe?", available: false },
  "05": { title: "Strip / Jitter Plot", question: "Wie streuen einzelne Punkte?", available: false },
  "06": { title: "Beeswarm Plot", question: "Wie verteilt sich jede einzelne Beobachtung?", available: false },
  "07": { title: "ECDF Plot", question: "Welcher Anteil der Daten liegt unter Wert x?", available: false },
  "08": { title: "Gruppierter Boxplot", question: "Wie unterscheiden sich Gruppen statistisch?", available: false },
  "09": { title: "Ridgeline Plot", question: "Wie verändert sich die Verteilung über Gruppen?", available: false },
  "10": { title: "Raincloud Plot", question: "Form + Statistik + Rohdaten zugleich?", available: false },
  "11": { title: "Dot Plot mit CI", question: "Wie unterscheiden sich Gruppen-Mittelwerte?", available: false },
  "12": { title: "Bar Chart (sortiert)", question: "Wie groß ist Wert X pro Kategorie?", available: false },
  /* ==========================================================
     #13 Scatter Plot
     ========================================================== */
  "13": {
    title: "Scatter Plot",
    question: "Wie hängen zwei numerische Variablen zusammen — linear, nichtlinear, gar nicht?",
    available: true,
    useWhen: "Der erste Blick auf jede Beziehung zwischen zwei numerischen Variablen: Trend, Cluster, Ausreißer, Heteroskedastizität — alles auf einmal.",
    useNot: "Ab ~20.000 Punkten wird Overplotting unbeherrschbar — dann Hexbin (#15) oder 2D-Density (#16). Für kategoriale x-Achsen: Strip Plot (#05).",
    labIntro: "Bestellwert gegen Lieferzeit, 5.000 Punkte. Spiel mit Deckkraft und Färbung — und finde heraus, wo die Struktur wirklich steckt.",
    goodBad: {
      intro: "Dieselben 5.000 Bestellungen, zwei Einstellungen:",
      goodLabel: "Transparenz",
      badLabel: "Volle Deckkraft",
      goodExplain: "Mit Deckkraft 0,15 wird aus dem Klumpen eine Dichtekarte: Die Masse liegt bei 20–100 € und 2–4 Tagen, einzelne Ausreißer bleiben sichtbar. Überlagerung wird zur Information statt zum Problem.",
      badExplain: "Voll deckende Punkte verschmelzen zu einer Fläche — ob hinter einem Punkt eine oder hundert Bestellungen stehen, ist nicht erkennbar. So lässt sich weder die Dichte noch ein Muster beurteilen.",
    },
    merksatz: "Kein Muster zu finden ist auch ein Ergebnis — aber nur, wenn die Punkte sichtbar sind.",
    pitfalls: [
      ["Overplotting", "Tausende deckende Punkte verschmelzen zu einer Fläche — Dichte und Muster verschwinden.", "Deckkraft senken (alpha 0,1–0,3), Punkte verkleinern; ab ~20k Punkten Hexbin/2D-Density."],
      ["Korrelation = Kausalität", "Ein sichtbarer Zusammenhang sagt nichts über die Richtung — oft steckt eine dritte Variable dahinter.", "Nach Confoundern fragen; Färbung nach Kandidaten-Variablen testen."],
      ["Nur auf r schauen", "Der Korrelationskoeffizient misst ausschließlich lineare Zusammenhänge — U-Formen ergeben r ≈ 0.", "Immer plotten, nie nur rechnen (Stichwort: Anscombe-Quartett)."],
      ["Verstecktes Gruppen-Muster", "Ein scheinbar strukturloser Scatter kann aus klar getrennten Gruppen bestehen (Simpson-Paradox).", "Nach kategorialen Variablen einfärben — wie hier nach Carrier."],
    ],
  },
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
  /* ==========================================================
     #24 Line Chart
     ========================================================== */
  "24": {
    title: "Line Chart",
    question: "Wie entwickelt sich eine Größe über die Zeit — Trend, Saisonalität, Ausreißer-Tage?",
    available: true,
    useWhen: "Zeitreihen mit regelmäßigen Abständen: Entwicklung, Saisonmuster und Strukturbrüche werden als Linienverlauf sofort lesbar.",
    useNot: "Bei wenigen, unregelmäßigen Messpunkten (dann Punkte statt Linie — die Linie suggeriert Zwischenwerte) und für Kategorien-Vergleiche (dann Bar Chart #12).",
    labIntro: "Ein Jahr Versanddaten, drei Metriken. Der Glättungs-Regler entscheidet, ob du Rauschen oder Signal siehst — und genau eine Metrik hat eine Geschichte zu erzählen.",
    goodBad: {
      intro: "Dieselbe Zeitreihe (Ø Lieferzeit pro Tag), zwei Darstellungen:",
      goodLabel: "Geglättet + Kontext",
      badLabel: "Rohes Rauschen",
      goodExplain: "Der 7-Tage-Schnitt (mit den Rohwerten als Kontext im Hintergrund) zeigt das ehrliche Bild: stabil um 3 Tage, mit einem klaren Anstieg im Dezember auf über 4 Tage — die Peak-Season.",
      badExplain: "Tagesmittel über nur ~14 Bestellungen springen rein zufällig um ±1 Tag. Wer hier einzelne Spitzen herausgreift („am 17. März explodierten die Lieferzeiten!“), präsentiert Rauschen als Ereignis.",
    },
    merksatz: "Achsenwahl und Glättung erzählen die Geschichte — wähle beide bewusst und zeige die Rohdaten als Kontext.",
    pitfalls: [
      ["Rauschen als Ereignis", "Tageswerte über kleinen Stichproben schwanken zufällig — einzelne Spitzen sind selten echte Ereignisse.", "Rolling Mean darüberlegen, Rohwerte blass im Hintergrund lassen."],
      ["Zu starke Glättung", "Ein 28-Tage-Schnitt macht aus einem scharfen Dezember-Anstieg einen sanften Hügel — Timing und Höhe stimmen nicht mehr.", "Fenstergröße an die Frage anpassen; mehrere Fenster testen."],
      ["Abgeschnittene y-Achse", "Ein Zoom auf 3,0–3,4 lässt normale Schwankungen dramatisch aussehen.", "Bei Linien ist eine Nicht-Null-Achse oft legitim — aber bewusst gewählt und klar beschriftet."],
      ["Spaghetti-Chart", "Acht Linien in einem Plot — nichts ist mehr verfolgbar.", "Small Multiples (#25) verwenden oder gezielt 1–2 Linien hervorheben, Rest grau."],
    ],
  },
  "25": { title: "Small Multiples", question: "Wie sieht der Trend pro Gruppe aus?", available: false },
  "26": { title: "Heatmap-Kalender", question: "Welche Tage und Wochen sind hoch oder niedrig?", available: false },
  "27": { title: "Stacked Bar (100 %)", question: "Wie verteilen sich Anteile pro Gruppe?", available: false },
  "28": { title: "Treemap", question: "Wie groß sind verschachtelte Anteile?", available: false },
  "29": { title: "Sankey / Alluvial", question: "Wie fließen Größen zwischen Kategorien?", available: false },
  "30": { title: "Choropleth Map", question: "Wie verteilt sich ein Wert geografisch?", available: false },
};

// Flache Pfad-Reihenfolge (für Vor/Zurück-Navigation)
const TEG_PATH_ORDER = TEG_CLUSTERS.flatMap((c) => c.modules);
