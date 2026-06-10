/* ============================================================
   chooser.js — der Entscheidungsbaum des Chart-Choosers.
   Reine Daten: Knoten mit Frage + Optionen. Eine Option führt
   entweder zu einem weiteren Knoten (`next`) oder zu einem
   Ergebnis (`result` mit Modul-Empfehlungen aus content.js).
   Gerendert wird in chooser.html.
   ============================================================ */

const TEG_CHOOSER_TREE = {
  start: {
    q: "Was willst du herausfinden?",
    options: [
      { label: "Wie eine einzelne Variable verteilt ist", next: "dist" },
      { label: "Wie sich Gruppen unterscheiden", next: "groups" },
      { label: "Ob und wie zwei Variablen zusammenhängen", next: "relation" },
      { label: "Wie sich etwas über die Zeit entwickelt", next: "time" },
      { label: "Wie sich ein Ganzes zusammensetzt (Anteile)", next: "parts" },
      { label: "Wie Mengen fließen oder sich geografisch verteilen", next: "flowgeo" },
      { label: "Was in vielen Variablen gleichzeitig steckt", next: "highdim" },
    ],
  },

  dist: {
    q: "Was interessiert dich an der Verteilung am meisten?",
    options: [
      {
        label: "Die Form: Gipfel, Schiefe, Ausreißer",
        result: {
          primary: ["01"], also: ["02"],
          note: "Das Histogramm ist der Standard-Einstieg in jede Verteilung. Wichtigste Regel: immer mehrere Bin-Breiten testen, bevor du der Form glaubst.",
        },
      },
      {
        label: "Eine glatte Kurve — gut zum Überlagern mehrerer Verteilungen",
        result: {
          primary: ["02"], also: ["01", "09"],
          note: "Der Density Plot (KDE) glättet das Histogramm. Die Bandbreite ist dabei der kritische Parameter — zu glatt verschluckt Gipfel, zu fein zeigt Rauschen.",
        },
      },
      {
        label: "Exakte Anteile: Wie viel Prozent liegt unter Wert x?",
        result: {
          primary: ["07"], also: ["01"],
          note: "Die ECDF ist parameterfrei — keine Bin- oder Bandbreiten-Entscheidung kann das Bild verzerren. Ideal auch für präzise Gruppen-Vergleiche.",
        },
      },
      {
        label: "Jede einzelne Beobachtung sehen",
        result: {
          primary: ["05", "06"], also: ["10"],
          note: "Bei kleinen bis mittleren Datenmengen sind echte Punkte die ehrlichste Darstellung — nichts wird aggregiert oder geglättet.",
        },
      },
      {
        label: "Nur die Kennzahlen: Median, Quartile, Ausreißer",
        result: {
          primary: ["03"], also: ["01", "07"],
          note: "Der Boxplot komprimiert die Verteilung auf fünf Kennzahlen — schnell und kompakt, aber die Form (z. B. zwei Gipfel) bleibt unsichtbar. Im Zweifel mit dem Histogramm gegenprüfen.",
        },
      },
    ],
  },

  groups: {
    q: "Vergleichst du ganze Verteilungen oder eine Kennzahl pro Gruppe?",
    options: [
      {
        label: "Eine Kennzahl (Summe, Anzahl, Anteil) pro Kategorie",
        result: {
          primary: ["12"], also: ["11"],
          note: "Der sortierte Bar Chart ist unschlagbar lesbar — sortiere nach Größe, nie alphabetisch.",
        },
      },
      {
        label: "Mittelwerte — inklusive ihrer Unsicherheit",
        result: {
          primary: ["11"], also: ["12"],
          note: "Dot Plots mit Konfidenzintervallen zeigen, ob sich Gruppen belastbar unterscheiden oder nur zufällig abweichen.",
        },
      },
      {
        label: "Verteilungen weniger Gruppen (2–8)",
        result: {
          primary: ["08"], also: ["04", "10"],
          note: "Gruppierte Boxplots nach Median sortieren. Wenn die Form wichtig ist (Mehrgipfligkeit!), mit Violin oder Raincloud gegenprüfen.",
        },
      },
      {
        label: "Verteilungen vieler oder geordneter Gruppen",
        result: {
          primary: ["09"], also: ["08"],
          note: "Der Ridgeline Plot zeigt, wie sich die Form über geordnete Gruppen verschiebt — z. B. über Monate oder Altersklassen.",
        },
      },
    ],
  },

  relation: {
    q: "Welche Typen haben die beiden Variablen?",
    options: [
      { label: "Numerisch × numerisch", next: "relnum" },
      {
        label: "Kategorisch × kategorisch",
        result: {
          primary: ["18"], also: ["27"],
          note: "Der Mosaic Plot zeigt als Flächenraster, ob zwei kategoriale Variablen voneinander abhängen.",
        },
      },
      { label: "Numerisch × kategorisch", next: "groups" },
    ],
  },

  relnum: {
    q: "Wie viele Datenpunkte hast du?",
    options: [
      {
        label: "Bis ~20.000 — Einzelpunkte sind noch unterscheidbar",
        result: {
          primary: ["13"], also: ["14", "17"],
          note: "Scatter Plot mit gesenkter Deckkraft. Für den Trend eine LOESS-Linie darüberlegen (#14); eine dritte Größe lässt sich als Punktgröße kodieren (#17).",
        },
      },
      {
        label: "Deutlich mehr — die Punkte verschmelzen zu Flächen",
        result: {
          primary: ["15", "16"], also: ["13"],
          note: "Dichte statt Einzelpunkte: Hexbin zählt Punkte pro Zelle, der Contour Plot glättet die gemeinsame Dichte.",
        },
      },
    ],
  },

  time: {
    q: "Wie viele Zeitreihen vergleichst du?",
    options: [
      {
        label: "Eine oder zwei",
        result: {
          primary: ["24"], also: ["26"],
          note: "Line Chart: Rohdaten blass im Hintergrund, Glättung kräftig darüber — so siehst du Signal und Rauschen zugleich.",
        },
      },
      {
        label: "Mehrere Gruppen",
        result: {
          primary: ["25"], also: ["24"],
          note: "Small Multiples statt Spaghetti-Chart: eine kleine Grafik pro Gruppe, identische Achsen — direkt vergleichbar.",
        },
      },
      {
        label: "Muster einzelner Tage über das Jahr",
        result: {
          primary: ["26"], also: ["24"],
          note: "Der Kalender-Heatmap zeigt Wochentags- und Saisonmuster, die in einer durchgehenden Linie untergehen.",
        },
      },
    ],
  },

  parts: {
    q: "Wie ist das Ganze strukturiert?",
    options: [
      {
        label: "Anteile über mehrere Gruppen vergleichen",
        result: {
          primary: ["27"], also: ["12"],
          note: "Auf 100 % normierte Stacked Bars machen Anteilsverschiebungen zwischen Gruppen direkt vergleichbar.",
        },
      },
      {
        label: "Verschachtelte Hierarchie (Kategorie → Unterkategorie)",
        result: {
          primary: ["28"], also: ["27"],
          note: "Die Treemap kodiert Größe als Fläche — stark für den Überblick, schwach für exakte Vergleiche ähnlich großer Felder.",
        },
      },
    ],
  },

  flowgeo: {
    q: "Fluss oder Karte?",
    options: [
      {
        label: "Mengen fließen zwischen Stationen oder Kategorien",
        result: {
          primary: ["29"], also: ["18"],
          note: "Das Sankey-Diagramm zeigt, wo Mengen herkommen und wohin sie gehen — die Bandbreite kodiert die Menge.",
        },
      },
      {
        label: "Werte auf einer Landkarte",
        result: {
          primary: ["30"], also: [],
          note: "Choropleth-Karte — aber Vorsicht: Große Flächen dominieren optisch, unabhängig von ihrer tatsächlichen Bedeutung. Pro-Kopf-Werte statt Absolutwerten verwenden.",
        },
      },
    ],
  },

  highdim: {
    q: "Was suchst du in den vielen Variablen?",
    options: [
      {
        label: "Welche Variablen miteinander zusammenhängen",
        result: {
          primary: ["19"], also: ["20"],
          note: "Die Korrelations-Heatmap als Übersicht — auffällige Paare danach im Pair Plot oder Scatter im Detail prüfen.",
        },
      },
      {
        label: "Alle paarweisen Beziehungen im Detail",
        result: {
          primary: ["20"], also: ["19"],
          note: "Der Pair Plot zeigt jede Kombination als Scatter. Ab ~8 Variablen wird er unübersichtlich — dann zuerst die Heatmap.",
        },
      },
      {
        label: "Profile und Muster einzelner Beobachtungen",
        result: {
          primary: ["21"], also: ["20"],
          note: "Parallel Coordinates leben von einer guten Achsen-Reihenfolge und Transparenz — sonst nur Liniensalat.",
        },
      },
      {
        label: "Versteckte Cluster oder niedrigdimensionale Struktur",
        result: {
          primary: ["22", "23"], also: ["19"],
          note: "PCA zuerst (linear, interpretierbar, schnell) — t-SNE/UMAP danach für nichtlineare Strukturen. Abstände in t-SNE/UMAP nie überinterpretieren.",
        },
      },
    ],
  },
};
