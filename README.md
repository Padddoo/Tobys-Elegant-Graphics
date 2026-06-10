# Toby's Elegant Graphics

> Eine interaktive Lernumgebung zum Thema **„Graphische Darstellung von Daten"** —
> 30 Visualisierungs-Patterns zum Anfassen, direkt im Browser.

**🌐 Live:** Gehostet auf **Vercel** — jeder Push deployt automatisch (Branches als Preview, `main` als Produktion). Die URL findest du im Vercel-Dashboard (`https://<projektname>.vercel.app`).

## Was ist das?

Jede der 30 Visualisierungen ist ein interaktives Lern-Modul mit:

- 🔬 **Parameter-Labor** — Slider & Controls verändern die Grafik live, am echten Datensatz. Man *sieht*, wie Bin-Breite, Skala & Co. die Aussage verändern.
- ⚖️ **Gut vs. Schlecht** — dieselben Daten einmal sauber, einmal irreführend dargestellt, per Klick umschaltbar.
- 📋 **Snippet-Karte** — das Python-Rezept (matplotlib/seaborn) zum Kopieren, als Minimal- und als präsentationstaugliche Version.
- ⚠️ **Merksatz & Fallstricke** — was die Grafik zeigt und was sie verschweigt.
- 🧠 **Quiz** — 2–3 Fragen mit Sofort-Feedback.

Dazu kommen ein **geführter Lernpfad** (Fortschritt wird im Browser gespeichert), ein **Chart-Chooser** (Entscheidungsbaum zur richtigen Grafik, in Arbeit) und ein übergreifender **Quiz-Modus** (in Arbeit).

Kein Login, kein Backend, kein Build-Step: Vanilla HTML/CSS/JS + [Plotly.js](https://plotly.com/javascript/), gehostet auf Vercel (`vercel.json` zeigt auf `docs/`).

## Lernziele

1. **Bei jedem neuen Datensatz innerhalb von 5 Minuten** die richtige Visualisierung wählen können.
2. Die **Trade-offs** jeder Grafik kennen — was sie zeigt und was sie verschweigt.
3. Eine eigene Bibliothek von **wiederverwendbaren Code-Snippets** haben.

## Repo-Struktur

```
tobys-elegant-graphics/
├── README.md
├── PROJECT_PLAN.md          ← Meilensteine & Architektur-Entscheidungen
├── vercel.json              ← statisches Deployment aus /docs
├── data/                    ← Quell-Datensätze (CSV)
│   └── shipping_orders_2024.csv
├── tools/                   ← Python-Skripte + requirements.txt (Datengenerierung, Vorberechnung)
└── docs/                    ← DIE WEB-APP (Vercel serviert aus /docs)
    ├── index.html           ← Start + Lernpfad
    ├── module.html          ← generische Modul-Seite (#01 … #30)
    ├── css/style.css
    ├── js/
    │   ├── app.js           ← Fortschritt (localStorage), DOM-Helfer
    │   ├── data.js          ← CSV laden & parsen
    │   ├── content.js       ← Texte, Snippets, Quizfragen aller Module
    │   └── labs.js          ← die Parameter-Labore (Plotly-Configs)
    └── data/                ← Kopien der CSVs für die App (fetch)
```

## Lokal entwickeln

```bash
git clone https://github.com/Padddoo/Tobys-Elegant-Graphics.git
cd Tobys-Elegant-Graphics/docs
python3 -m http.server 8000
# → http://localhost:8000
```

Kein npm, kein Build — Dateien ändern, Browser neu laden.

## Die 30 Module

Status: ✅ verfügbar · 🔒 in Arbeit (Reihenfolge laut [PROJECT_PLAN.md](PROJECT_PLAN.md))

### Cluster 1 · Fundament
| # | Grafik | Frage | |
|---|--------|-------|---|
| 01 | Histogramm | Wie ist eine Variable verteilt? | ✅ |
| 03 | Boxplot | Median, Quartile, Ausreißer auf einen Blick | ✅ |
| 13 | Scatter Plot | Wie hängen zwei Variablen zusammen? | ✅ |
| 24 | Line Chart | Wie entwickelt sich eine Größe über Zeit? | ✅ |

### Cluster 2 · Verteilungen & Gruppen
| # | Grafik | Frage |
|---|--------|-------|
| 02 | Density Plot (KDE) | Wie sieht die geglättete Verteilung aus? |
| 04 | Violin Plot | Wie unterscheidet sich die Form pro Gruppe? |
| 05 | Strip / Jitter Plot | Wie streuen einzelne Punkte? |
| 06 | Beeswarm Plot | Wie verteilt sich jede Beobachtung? |
| 07 | ECDF Plot | Welcher Anteil liegt unter Wert x? |
| 08 | Gruppierter Boxplot | Wie unterscheiden sich Gruppen statistisch? |
| 09 | Ridgeline Plot | Wie verändert sich die Verteilung über Gruppen? |
| 10 | Raincloud Plot | Form + Statistik + Rohdaten zugleich |
| 11 | Dot Plot mit CI | Wie unterscheiden sich Gruppen-Mittelwerte? |
| 12 | Bar Chart (sortiert) | Wie groß ist Wert X pro Kategorie? |

### Cluster 3 · Beziehungen
| # | Grafik | Frage |
|---|--------|-------|
| 14 | Scatter + LOESS | Welcher Trend liegt im Streudiagramm? |
| 15 | Hexbin Plot | Wo häufen sich Punkte bei großen Datenmengen? |
| 16 | 2D Density / Contour | Wie liegt die gemeinsame Dichte? |
| 17 | Bubble Chart | 3 Variablen: x, y, Größe |
| 18 | Mosaic Plot | Wie hängen zwei kategoriale Variablen zusammen? |
| 29 | Sankey / Alluvial | Wie fließen Größen zwischen Kategorien? |

### Cluster 4 · Hochdimensional
| # | Grafik | Frage |
|---|--------|-------|
| 19 | Korrelations-Heatmap | Was korreliert mit was? |
| 20 | Pair Plot | Alle paarweisen Beziehungen |
| 21 | Parallel Coordinates | Gruppen-Muster über viele Dimensionen |
| 22 | PCA Scatter / Biplot | Wie strukturieren sich Hochdim-Daten? |
| 23 | t-SNE / UMAP Plot | Nichtlineare Cluster |

### Cluster 5 · Storytelling
| # | Grafik | Frage |
|---|--------|-------|
| 25 | Small Multiples | Trend pro Gruppe |
| 26 | Heatmap-Kalender | Welche Tage/Wochen sind hoch/niedrig? |
| 27 | Stacked Bar (100%) | Wie verteilen sich Anteile pro Gruppe? |
| 28 | Treemap | Wie groß sind verschachtelte Anteile? |
| 30 | Choropleth Map | Wie verteilt sich ein Wert geografisch? |

## Datensätze

### `shipping_orders_2024.csv`

5.000 simulierte Bestellungen eines mittelständischen Versenders (2024). Bewusst realistisch:
rechtsschiefe Bestellwerte (≈ log-normal), unterschiedliche Carrier-Performance, Dezember-Saisonalität, ~1,5 % Ausreißer.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `order_id` | string | Eindeutige Bestellnummer |
| `order_date` | datetime | Bestelldatum |
| `region` | kategorisch | Nord, Sued, Ost, West, Zentral |
| `carrier` | kategorisch | DHL, Hermes, DPD, GLS, UPS |
| `product_category` | kategorisch | Electronics, Apparel, Home, Books, Food |
| `order_value_eur` | numerisch | Bestellwert in EUR |
| `delivery_days` | numerisch | Lieferzeit in Tagen |

Weitere Datensätze (hochdimensional für Cluster 4, Geo-Aggregat für #30) folgen laut Plan.

## Lizenz

MIT — frei verwendbar, gerne weitergeben.

## Autor

Tobias · ConBrio · 2026
Begleitet durch das ML-Lernprogramm und die „30 Elegant Graphics"-Übersicht.
