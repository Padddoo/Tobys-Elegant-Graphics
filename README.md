# Toby's Elegant Graphics

> Ein Werkzeugkasten von 30 Visualisierungs-Patterns für Datenanalyse, EDA und Storytelling — jeder Use Case als eigenes Colab-Notebook mit echtem Beispiel-Datensatz.

## Was ist das?

Dieses Repository ist ein begleitendes Lern- und Nachschlagewerk zu den **30 Elegant Graphics for Data Analysis**. Für jede Visualisierung gibt es:

- ein **Colab-Notebook** mit kommentiertem Python-Code
- einen **realistischen Beispiel-Datensatz** im `/data/`-Ordner
- ein **gerendertes Beispiel-Bild** in `/images/`
- eine kurze **README-Sektion**, die erklärt: Wann nutzen? Was zeigt es? Wo sind die Fallstricke?

Das Repo ist bewusst pragmatisch gehalten — keine Frameworks, keine Setup-Dramen. Jedes Notebook läuft eigenständig in Google Colab, kein lokales Setup nötig.

## Repo-Struktur

```
tobys-elegant-graphics/
├── README.md                          ← Diese Datei
├── requirements.txt                   ← Python-Pakete für lokale Nutzung
├── .gitignore
├── data/                              ← Beispiel-Datensätze (CSV)
│   └── shipping_orders_2024.csv      ← Mittelständischer Versandbetrieb
├── notebooks/                         ← Ein Colab-Notebook pro Use Case
│   ├── 01_histogramm.ipynb
│   ├── 03_boxplot.ipynb
│   └── ...
└── images/                            ← Gerenderte Plots als PNG
    └── ...
```

## Lernziel

Drei Dinge, die ich nach Durcharbeiten dieses Repos können möchte:

1. **Bei jedem neuen Datensatz innerhalb von 5 Minuten** die richtige Visualisierung wählen können.
2. Die **Trade-offs** jeder Grafik kennen — was sie zeigt und was sie verschweigt.
3. Eine eigene Bibliothek von **wiederverwendbaren Code-Snippets** haben, die ich in Projekten copy-paste-anpassen kann.

## Quickstart

### Variante A: Google Colab (empfohlen)

1. Notebook in `/notebooks/` öffnen → Button **"Open in Colab"** klicken
2. Erste Zelle ausführen — sie lädt den Datensatz automatisch von GitHub
3. Durcharbeiten, eigene Varianten ausprobieren

### Variante B: Lokal mit Python

```bash
git clone https://github.com/<dein-username>/tobys-elegant-graphics.git
cd tobys-elegant-graphics
pip install -r requirements.txt
jupyter notebook
```

## Die 30 Use Cases — Übersicht

### A. Verteilung einer Variable
| # | Grafik | Frage |
|---|--------|-------|
| 1 | Histogramm | Wie ist eine Variable verteilt? |
| 2 | Density Plot (KDE) | Wie sieht die geglättete Verteilung aus? |
| 3 | Boxplot | Median, Quartile, Ausreißer auf einen Blick |
| 4 | Violin Plot | Wie unterscheidet sich die Form pro Gruppe? |
| 5 | Strip / Jitter Plot | Wie streuen einzelne Punkte? |
| 6 | Beeswarm Plot | Wie verteilt sich jede Beobachtung? |
| 7 | ECDF Plot | Welcher Anteil liegt unter Wert x? |

### B. Gruppen vergleichen
| # | Grafik | Frage |
|---|--------|-------|
| 8 | Gruppierter Boxplot | Wie unterscheiden sich Gruppen statistisch? |
| 9 | Ridgeline Plot | Wie verändert sich die Verteilung über Gruppen? |
| 10 | Raincloud Plot | Form + Statistik + Rohdaten zugleich |
| 11 | Dot Plot mit CI | Wie unterscheiden sich Gruppen-Mittelwerte? |
| 12 | Bar Chart (sortiert) | Wie groß ist Wert X pro Kategorie? |

### C. Beziehung zwischen zwei Variablen
| # | Grafik | Frage |
|---|--------|-------|
| 13 | Scatter Plot | Wie hängen zwei Variablen zusammen? |
| 14 | Scatter + LOESS/Reg | Welcher Trend liegt im Streudiagramm? |
| 15 | Hexbin Plot | Wo häufen sich Punkte bei großen Datenmengen? |
| 16 | 2D Density / Contour | Wie liegt die gemeinsame Dichte? |
| 17 | Bubble Chart | 3 Variablen: x, y, Größe |
| 18 | Mosaic Plot | Wie hängen zwei kategoriale Variablen zusammen? |

### D. Viele Variablen / Hochdimensional
| # | Grafik | Frage |
|---|--------|-------|
| 19 | Korrelations-Heatmap | Was korreliert mit was? |
| 20 | Pair Plot | Alle paarweisen Beziehungen |
| 21 | Parallel Coordinates | Gruppen-Muster über viele Dimensionen |
| 22 | PCA Scatter / Biplot | Wie strukturieren sich Hochdim-Daten? |
| 23 | t-SNE / UMAP Plot | Nichtlineare Cluster |

### E. Zeitreihen
| # | Grafik | Frage |
|---|--------|-------|
| 24 | Line Chart | Wie entwickelt sich eine Größe über Zeit? |
| 25 | Small Multiples / Faceted | Trend pro Gruppe |
| 26 | Heatmap-Kalender | Welche Tage/Wochen sind hoch/niedrig? |

### F. Anteile & Komposition
| # | Grafik | Frage |
|---|--------|-------|
| 27 | Stacked Bar (100%) | Wie verteilen sich Anteile pro Gruppe? |
| 28 | Treemap | Wie groß sind verschachtelte Anteile? |

### G. Fluss & Spezial
| # | Grafik | Frage |
|---|--------|-------|
| 29 | Sankey / Alluvial | Wie fließen Größen zwischen Kategorien? |
| 30 | Choropleth Map | Wie verteilt sich ein Wert geografisch? |

## Datensätze

### `shipping_orders_2024.csv`

5.000 simulierte Bestellungen eines mittelständischen Versenders im Jahr 2024. Bewusst realistisch konstruiert: rechtsschiefe Verteilung von Bestellwerten, unterschiedliche Performance-Level pro Versanddienstleister, Saisonalität im Dezember, ca. 1,5% Ausreißer.

**Spalten:**
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `order_id` | string | Eindeutige Bestellnummer |
| `order_date` | datetime | Bestelldatum |
| `region` | kategorisch | Lieferregion (Nord, Sued, Ost, West, Zentral) |
| `carrier` | kategorisch | Versanddienstleister (DHL, Hermes, DPD, GLS, UPS) |
| `product_category` | kategorisch | Produktkategorie (5 Werte) |
| `order_value_eur` | numerisch | Bestellwert in EUR |
| `delivery_days` | numerisch | Tatsächliche Lieferzeit in Tagen |

**Wofür geeignet:**
- Use Case #1 (Histogramm): Verteilung der Lieferzeiten
- Use Case #3 (Boxplot): Lieferzeit-Vergleich zwischen Carriern
- Use Case #4 (Violin Plot): Form-Vergleich der Lieferzeit-Verteilungen
- Use Case #13 (Scatter): Bestellwert vs. Lieferzeit
- Use Case #19 (Heatmap): Korrelationsmatrix der numerischen Spalten
- Use Case #24 (Line Chart): Tägliche Bestellvolumen über das Jahr
- Use Case #26 (Kalender-Heatmap): Bestellungen pro Tag
- Use Case #27 (Stacked Bar): Carrier-Anteile pro Region

## Lernreihenfolge (empfohlen)

Statt linear durchzugehen, schlage ich folgende Cluster-Reihenfolge vor:

1. **Fundament**: #1 Histogramm, #3 Boxplot, #13 Scatter, #24 Line Chart — das Brot-und-Butter-Set, das in 70% aller EDA-Situationen reicht.
2. **Verteilungs-Tiefe**: #2 Density, #4 Violin, #7 ECDF, #10 Raincloud — damit verstehst du, was hinter dem Boxplot steckt.
3. **Beziehungen vertiefen**: #14 LOESS, #15 Hexbin, #16 2D Density, #19 Heatmap, #20 Pair Plot — bivariate und multivariate Sicht.
4. **Hochdimensional**: #21 Parallel Coords, #22 PCA, #23 t-SNE/UMAP — Brücke zu ML-Datensätzen.
5. **Storytelling**: #25 Small Multiples, #26 Kalender, #28 Treemap, #29 Sankey, #30 Choropleth — für Präsentationen und LinkedIn-Posts.

## Lizenz

MIT — frei verwendbar, gerne weitergeben.

## Autor

Tobias · ConBrio · 2026
Begleitet durch das ML-Lernprogramm und die "30 Elegant Graphics"-Übersicht.
