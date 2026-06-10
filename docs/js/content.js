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
    snippets: {
      minimal:
`import seaborn as sns

sns.boxplot(data=df, x="carrier", y="delivery_days")`,
      elegant:
`import matplotlib.pyplot as plt
import seaborn as sns

order = df.groupby("carrier")["delivery_days"].median().sort_values().index

fig, ax = plt.subplots(figsize=(9, 5))
sns.boxplot(data=df, x="carrier", y="delivery_days",
            order=order, color="#4338ca", width=0.5, ax=ax)

ax.set_title("UPS liefert in 2–3 Tagen — Hermes hat einen langen Schwanz")
ax.set_xlabel("")
ax.set_ylabel("Lieferzeit (Tage)")
sns.despine()
fig.tight_layout()`,
    },
    merksatz: "Ein Boxplot ist eine Zusammenfassung — fünf Zahlen sind keine Verteilung.",
    pitfalls: [
      ["Form bleibt unsichtbar", "Zwei völlig verschiedene Verteilungen (z. B. zweigipflig vs. symmetrisch) können identische Boxplots haben.", "Bei wichtigen Variablen zusätzlich Histogramm (#01) oder Violin (#04) prüfen."],
      ["Kleine Gruppen wirken solide", "Eine Box über 15 Werten sieht genauso vertrauenswürdig aus wie eine über 1.500.", "Punkte einblenden oder n pro Gruppe annotieren."],
      ["„Ausreißer“ wörtlich nehmen", "Die 1,5×IQR-Regel ist eine Konvention, kein Fehlerdetektor — bei schiefen Daten markiert sie massenhaft normale Werte.", "Schiefe zuerst prüfen (log-Skala testen), Ausreißer fachlich bewerten."],
      ["Unsortierte Gruppen", "Alphabetische Reihenfolge versteckt das Muster.", "Nach Median sortieren — Unterschiede springen sofort ins Auge."],
    ],
    quiz: [
      {
        q: "Zwei Carrier haben exakt identische Boxplots. Sind ihre Lieferzeit-Verteilungen damit gleich?",
        options: [
          "Ja — der Boxplot erfasst die Verteilung vollständig.",
          "Nein — der Boxplot zeigt nur fünf Kennzahlen; z. B. Zweigipfligkeit bleibt komplett unsichtbar.",
          "Ja, sofern beide Gruppen gleich groß sind.",
        ],
        correct: 1,
        explain: "Median, Quartile und Whisker können übereinstimmen, während die Verteilungen dazwischen völlig verschieden aussehen. Deshalb: Bei wichtigen Befunden die Form mit Histogramm oder Violin gegenprüfen.",
      },
      {
        q: "Beim Boxplot der Bestellwerte erscheinen hunderte Punkte oberhalb des Whiskers. Was bedeutet das?",
        options: [
          "Die Daten enthalten hunderte Messfehler, die bereinigt werden müssen.",
          "Das Diagramm ist falsch konfiguriert.",
          "Die Verteilung ist rechtsschief — die 1,5×IQR-Konvention markiert dann viele ganz normale Werte.",
        ],
        correct: 2,
        explain: "Die Ausreißer-Markierung ist eine Konvention für symmetrische Verteilungen. Bei schiefen Daten (wie Bestellwerten) ist der lange Schwanz Teil des Phänomens — keine Datenpanne. Auf der log-Skala verschwinden die meisten dieser „Ausreißer“.",
      },
      {
        q: "Du willst die Lieferzeit von 12 Produktkategorien vergleichen. Boxplot oder Histogramm?",
        options: [
          "Boxplot — 12 Verteilungen kompakt nebeneinander, sortiert nach Median.",
          "Histogramm — 12 überlagerte Histogramme in einem Plot.",
          "Keins von beidem, das geht nur mit einer Tabelle.",
        ],
        correct: 0,
        explain: "Genau hier spielt der Boxplot seine Stärke aus: viele Gruppen, eine Achse, direkte Vergleichbarkeit. 12 überlagerte Histogramme wären unlesbar (ab ~3 Gruppen wird's kritisch).",
      },
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
    snippets: {
      minimal:
`import seaborn as sns

sns.scatterplot(data=df, x="order_value_eur", y="delivery_days",
                alpha=0.2, s=12)`,
      elegant:
`import matplotlib.pyplot as plt
import seaborn as sns

fig, ax = plt.subplots(figsize=(9, 5))
sns.scatterplot(data=df, x="order_value_eur", y="delivery_days",
                hue="carrier", alpha=0.25, s=14, ax=ax)

ax.set_xscale("log")
ax.set_title("Lieferzeit hängt am Carrier, nicht am Bestellwert (r ≈ 0)")
ax.set_xlabel("Bestellwert (EUR, log-Skala)")
ax.set_ylabel("Lieferzeit (Tage)")
ax.legend(title="", frameon=False)
sns.despine()
fig.tight_layout()`,
    },
    merksatz: "Kein Muster zu finden ist auch ein Ergebnis — aber nur, wenn die Punkte sichtbar sind.",
    pitfalls: [
      ["Overplotting", "Tausende deckende Punkte verschmelzen zu einer Fläche — Dichte und Muster verschwinden.", "Deckkraft senken (alpha 0,1–0,3), Punkte verkleinern; ab ~20k Punkten Hexbin/2D-Density."],
      ["Korrelation = Kausalität", "Ein sichtbarer Zusammenhang sagt nichts über die Richtung — oft steckt eine dritte Variable dahinter.", "Nach Confoundern fragen; Färbung nach Kandidaten-Variablen testen."],
      ["Nur auf r schauen", "Der Korrelationskoeffizient misst ausschließlich lineare Zusammenhänge — U-Formen ergeben r ≈ 0.", "Immer plotten, nie nur rechnen (Stichwort: Anscombe-Quartett)."],
      ["Verstecktes Gruppen-Muster", "Ein scheinbar strukturloser Scatter kann aus klar getrennten Gruppen bestehen (Simpson-Paradox).", "Nach kategorialen Variablen einfärben — wie hier nach Carrier."],
    ],
    quiz: [
      {
        q: "Bestellwert und Lieferzeit haben Pearson r = −0,01. Was folgt daraus?",
        options: [
          "Die beiden Variablen sind garantiert unabhängig.",
          "Es gibt praktisch keinen linearen Zusammenhang — nichtlineare Muster muss der Plot trotzdem ausschließen.",
          "Der Datensatz ist fehlerhaft, irgendein Zusammenhang besteht immer.",
        ],
        correct: 1,
        explain: "r misst nur lineare Beziehungen. Eine U-Form oder getrennte Cluster können bei r ≈ 0 existieren — deshalb gehört zum Korrelationskoeffizienten immer der Scatter Plot. Hier bestätigt er: wirklich kein Muster zwischen Wert und Lieferzeit.",
      },
      {
        q: "Erst nach dem Einfärben nach Carrier werden horizontale Bänder sichtbar. Welche Lektion steckt darin?",
        options: [
          "Färbung ist Dekoration und ändert nichts an der Aussage.",
          "Scatter Plots funktionieren nur mit zwei Variablen.",
          "Eine dritte Variable kann die eigentliche Struktur tragen — ohne sie wirkt der Plot strukturlos.",
        ],
        correct: 2,
        explain: "Die Lieferzeit wird vom Carrier bestimmt, nicht vom Bestellwert. Solche Schichtungen (und im Extremfall das Simpson-Paradox) findet man nur, wenn man kategoriale Variablen als Färbung durchprobiert.",
      },
      {
        q: "Du hast 500.000 Punkte und alles ist schwarz. Was ist der beste nächste Schritt?",
        options: [
          "Punkte vergrößern, damit man sie besser sieht.",
          "Auf Hexbin (#15) oder 2D-Density (#16) wechseln — die zeigen Dichte statt Einzelpunkte.",
          "Die Hälfte der Daten löschen.",
        ],
        correct: 1,
        explain: "Transparenz hilft bis zu einigen zehntausend Punkten. Darüber ist Aggregation die ehrliche Lösung: Hexbin und 2D-Density zeigen, wo wie viele Punkte liegen, statt sie übereinander zu stapeln.",
      },
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
    snippets: {
      minimal:
`daily = df.set_index("order_date")["delivery_days"].resample("D").mean()
daily.rolling(7).mean().plot()`,
      elegant:
`import matplotlib.pyplot as plt

daily = df.set_index("order_date")["delivery_days"].resample("D").mean()

fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(daily.index, daily, color="#9494a6", alpha=0.35,
        lw=1, label="Tageswerte")
ax.plot(daily.index, daily.rolling(7, center=True).mean(),
        color="#4338ca", lw=2, label="7-Tage-Schnitt")

ax.set_title("Lieferzeiten stabil bei ~3 Tagen — Dezember-Peak über 4")
ax.set_ylabel("Ø Lieferzeit (Tage)")
ax.legend(frameon=False)
fig.tight_layout()`,
    },
    merksatz: "Achsenwahl und Glättung erzählen die Geschichte — wähle beide bewusst und zeige die Rohdaten als Kontext.",
    pitfalls: [
      ["Rauschen als Ereignis", "Tageswerte über kleinen Stichproben schwanken zufällig — einzelne Spitzen sind selten echte Ereignisse.", "Rolling Mean darüberlegen, Rohwerte blass im Hintergrund lassen."],
      ["Zu starke Glättung", "Ein 28-Tage-Schnitt macht aus einem scharfen Dezember-Anstieg einen sanften Hügel — Timing und Höhe stimmen nicht mehr.", "Fenstergröße an die Frage anpassen; mehrere Fenster testen."],
      ["Abgeschnittene y-Achse", "Ein Zoom auf 3,0–3,4 lässt normale Schwankungen dramatisch aussehen.", "Bei Linien ist eine Nicht-Null-Achse oft legitim — aber bewusst gewählt und klar beschriftet."],
      ["Spaghetti-Chart", "Acht Linien in einem Plot — nichts ist mehr verfolgbar.", "Small Multiples (#25) verwenden oder gezielt 1–2 Linien hervorheben, Rest grau."],
    ],
    quiz: [
      {
        q: "Das Bestellvolumen ist übers Jahr flach, aber die Ø Lieferzeit steigt im Dezember auf 4,2 Tage. Welcher Schluss liegt nahe?",
        options: [
          "Im Dezember wurde mehr bestellt, daher die Verzögerung.",
          "Die Daten widersprechen sich und sind unbrauchbar.",
          "Die Leistung sinkt saisonal (z. B. Netzwerk-Überlastung der Carrier) — nicht die eigene Nachfrage ist der Treiber.",
        ],
        correct: 2,
        explain: "Genau dafür lohnt der Blick auf mehrere Metriken derselben Zeitachse: Das eigene Volumen ist konstant (~13–14 Bestellungen/Tag), die Verzögerung kommt von außen — die Carrier-Netze sind in der Peak-Season insgesamt überlastet.",
      },
      {
        q: "Wann ist eine y-Achse, die nicht bei 0 beginnt, bei Linien-Charts vertretbar?",
        options: [
          "Nie — Achsen müssen immer bei 0 beginnen.",
          "Wenn es um Veränderungen einer Größe geht, deren Nullpunkt irrelevant ist — klar beschriftet und bewusst gewählt.",
          "Immer — das spart Platz.",
        ],
        correct: 1,
        explain: "Anders als bei Balken (deren Länge die Größe kodiert) zeigt eine Linie Veränderung. Bei einer Lieferzeit um 3 Tage wäre eine 0-Achse sogar irreführend leer. Entscheidend: Die Wahl muss bewusst sein und erkennbar bleiben — nicht jede Schwankung dramatisieren.",
      },
      {
        q: "Dein 28-Tage-Schnitt zeigt einen sanften Anstieg ab Mitte November. Die Rohdaten zeigen einen scharfen Sprung am 1. Dezember. Was stimmt?",
        options: [
          "Der 28-Tage-Schnitt — Glättung ist immer näher an der Wahrheit.",
          "Die Rohdaten — starke Glättung verschmiert abrupte Ereignisse über das ganze Fenster.",
          "Beides gleichermaßen, die Darstellungen sind austauschbar.",
        ],
        correct: 1,
        explain: "Ein Rolling Mean verteilt jedes Ereignis über die Fensterbreite: Der Sprung „beginnt“ in der geglätteten Kurve scheinbar Wochen früher. Deshalb Rohdaten immer als Kontext mitzeigen — die Glättung beantwortet „Trend?“, die Rohdaten „Wann genau?“.",
      },
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
