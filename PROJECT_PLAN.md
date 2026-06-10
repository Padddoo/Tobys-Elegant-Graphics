# Projektplan v2: Toby's Elegant Graphics — Interaktive Lernumgebung

> Eine **webbasierte, voll interaktive Lernumgebung** zum Thema „Graphische Darstellung von Daten",
> aufgebaut auf den 30 Visualisierungs-Patterns aus dem README — erreichbar unter eigener URL,
> ohne Server, ohne Betriebskosten.

**Stand:** 2026-06-10 · **Branch:** `claude/data-viz-learning-env-s46isl`
**Hosting:** Vercel (verbunden mit dem GitHub-Repo; Branch-Pushes = Preview-Deployments, `main` = Produktion)

---

## 0. Architektur-Entscheidung (ersetzt Plan v1)

Plan v1 folgte der README-Spec (Colab-Notebooks). Entscheidung vom 2026-06-10:

- **Die Lernumgebung ist eine statische Web-App** (HTML/CSS/JS + Plotly.js), gehostet auf
  **Vercel** (Entscheidung 2026-06-10, ersetzt GitHub Pages) → eigene URL, automatisches
  Deployment bei jedem Push, läuft auf jedem Gerät.
- **Gestrichen (Entscheidung 2026-06-10):** Snippet-Karten und Quiz entfallen ersatzlos —
  der Fokus liegt auf Parameter-Laboren, Gut/Schlecht-Vergleichen und dem Chart-Chooser
  (aus M2 vorgezogen und umgesetzt).
- **Kein Build-Step, kein Framework**: Vanilla JS + Plotly.js per CDN. Das hält die Codebasis
  für einen Lernenden les- und wartbar und passt zum Repo-Motto „keine Setup-Dramen".
- Colab-Notebooks sind **nicht mehr im Scope** (das Template aus M0/v1 wird entfernt).

## 1. Was die App kann (Produktsicht)

Die 30 Use Cases aus dem README bleiben der fachliche Kern. Die App verpackt sie in
vier Erlebnis-Bausteine:

| Baustein | Beschreibung | Lernziel aus dem README |
|----------|--------------|------------------------|
| **Lernpfad** | Die 5 Cluster (Fundament → Storytelling) als geführter Pfad; Fortschritt pro Modul im `localStorage` | Struktur & Motivation |
| **Parameter-Labor** | Pro Grafik ein Live-Playground: Slider & Controls (Bins, Bandbreite, Jitter, log-Skala …) verändern die Plotly-Grafik sofort — am echten Shipping-Datensatz | „Trade-offs jeder Grafik kennen" |
| **Chart-Chooser** | Interaktiver Entscheidungsbaum: „Wie viele Variablen? Welcher Typ? Welche Frage?" → führt zur passenden Grafik | „In 5 Min. die richtige Visualisierung wählen" |
| **Fallstricke** | Pro Grafik ein umschaltbarer Gut/Schlecht-Vergleich (z. B. abgeschnittene Achse) + Merksatz & Fallstrick-Tabelle | Kritisches Sehen |

### Aufbau einer Use-Case-Seite (einheitlich für alle 30)

1. **Die Frage** — welche analytische Frage beantwortet diese Grafik?
2. **Parameter-Labor** — interaktive Plotly-Grafik mit 2–4 Controls
3. **Gut vs. Schlecht** — dieselben Daten einmal sauber, einmal irreführend dargestellt, umschaltbar
4. **Merksatz & Fallstricke** — kompakte Trade-off-Tabelle
5. **Weiter im Pfad** — Navigation zum nächsten Modul, Fortschritts-Haken

## 2. Technische Architektur

```
tobys-elegant-graphics/            (Repo-Root)
├── README.md                      ← wird in M0 auf Web-App-Konzept aktualisiert
├── PROJECT_PLAN.md
├── data/
│   ├── shipping_orders_2024.csv   ← vorhanden (5.000 Bestellungen)
│   ├── product_metrics.csv        ← neu (M4, hochdimensional)
│   └── projections.json           ← neu (M4, vorberechnete PCA/t-SNE/UMAP-Koordinaten)
├── tools/                         ← Python-Skripte: Datengenerierung & Vorberechnung
│   └── precompute.py
└── docs/                          ← DIE WEB-APP (Vercel serviert aus /docs, s. vercel.json)
    ├── index.html                 ← Start + Lernpfad-Übersicht
    ├── chooser.html               ← Chart-Chooser (Entscheidungsbaum)
    ├── module.html                ← generische Use-Case-Seite (rendert aus Config)
    ├── css/style.css              ← Design-System (eine Datei)
    ├── js/
    │   ├── app.js                 ← Navigation, Fortschritt (localStorage), Router (#01 …)
    │   ├── data.js                ← CSV-Laden/Parsen, abgeleitete Aggregate
    │   ├── chooser.js             ← Entscheidungsbaum-Daten
    │   ├── labs.js                ← die 30 Parameter-Labore (Plotly-Konfigurationen)
    │   └── content.js             ← Texte und Fallstricke (alle 30 Module)
    └── data/ → ../data            ← CSVs für fetch() erreichbar (Kopie/Symlink-Strategie in M0 klären)
```

**Leitprinzipien:**
- **Content-getrieben:** Eine generische `module.html` rendert jedes der 30 Module aus einer
  Config in `content.js`/`labs.js`. Neues Modul = neuer Config-Eintrag, kein neues HTML.
- **Plotly.js als einzige Chart-Lib** (CDN, ~3.5 MB, wird gecacht). Deckt nativ ab: Histogramm,
  Box, Violin, Scatter, Line, Heatmap, Contour, 2D-Histogramm, Parallel Coordinates, Sankey,
  Treemap, Choropleth.
- **Vorberechnung statt Browser-Rechnen:** PCA/t-SNE/UMAP-Koordinaten, LOESS-Stützpunkte und
  KDE-Kurven werden einmalig per Python (`tools/`) erzeugt und als JSON ausgeliefert.
- **Kein Backend, kein Tracking, kein Login.** Fortschritt liegt nur im Browser.

### Plotly-Abdeckung der 30 Use Cases — Sonderfälle

| Use Case | Lösung im Browser |
|----------|------------------|
| #06 Beeswarm | berechnetes Jitter-Layout (kleiner JS-Algorithmus) |
| #09 Ridgeline | gestapelte, versetzte Dichte-Flächen (vorberechnete KDE) |
| #10 Raincloud | Kombi aus Half-Violin + Box + Jitter-Punkten |
| #14 LOESS | Stützpunkte vorberechnet (Python), als Linie gerendert |
| #15 Hexbin | Plotly `histogram2d` (rechteckig) + Hinweis auf Hex-Variante im Python-Snippet |
| #18 Mosaic | eigene Rechteck-Geometrie (JS, ~50 Zeilen) |
| #22/#23 PCA, t-SNE/UMAP | Koordinaten vorberechnet → Scatter |
| #26 Kalender-Heatmap | Heatmap mit Wochen×Wochentag-Gitter (JS-Datumslogik) |
| #30 Choropleth | Plotly-Choropleth + GeoJSON Bundesländer (offene Quelle, eingecheckt) |

## 3. Datensätze

- **`shipping_orders_2024.csv`** (vorhanden): trägt ~22 der 30 Module (Verteilung, Gruppen,
  Beziehungen, Zeitreihen, Komposition, Sankey).
- **`product_metrics.csv`** (neu in M4): 8–12 numerische Features mit eingebauten Korrelationen
  und 3–4 Clustern — für Heatmap, Pair Plot, Parallel Coords, PCA, t-SNE/UMAP.
- **Geo-Aggregat + GeoJSON** (neu in M5): Bestellwerte je Bundesland für die Choropleth-Karte.
- Browser lädt CSVs per `fetch()`; Parsing mit kleinem eigenem Parser (kein Dependency-Zoo).

## 4. Meilensteine

> **Stand 2026-06-10:** M0–M5 sind umgesetzt — alle 30 Module live, inkl. Produkt-Datensatz,
> vorberechneter Projektionen und Geo-Daten. Offen ist M6 (QA & Politur).

### M0 — App-Durchstich (das wichtigste Arbeitspaket)
- `docs/`-Grundgerüst: Layout, Navigation, Design-System, CSV-Loader, Fortschritts-Logik
- **Ein komplettes Modul (#01 Histogramm)** mit allen Sektionen inkl. Parameter-Labor
  (Slider: Bin-Anzahl, log-Skala, Dichte-Normierung) und Gut/Schlecht
- Lernpfad-Startseite mit den 5 Clustern (Module verlinkt, noch als „bald verfügbar")
- Aufräumen: Notebook-Template entfernen, README auf Web-App-Konzept aktualisieren,
  requirements.txt auf `tools/`-Bedarf reduzieren
- Vercel-Deployment einrichten (`vercel.json`: statisch aus `/docs`, kein Build) —
  lokal weiterhin testbar via `python -m http.server`
- **Ergebnis: Die App ist unter der eigenen URL erreichbar und ein Modul ist komplett erlebbar
  → Review-Punkt: Design & Modul-Aufbau ok?**

### M1 — Fundament-Cluster (3 weitere Module)
- #03 Boxplot · #13 Scatter · #24 Line Chart (gleiches Schema wie #01)
- Fortschritts-Anzeige im Lernpfad scharf schalten
- **Ergebnis:** Cluster 1 „Brot und Butter" komplett durchspielbar

### M2 — Verteilungen & Gruppen (10 Module)
- Chart-Chooser: ✅ bereits umgesetzt (vorgezogen, 2026-06-10)
- #02 Density · #04 Violin · #05 Strip · #06 Beeswarm · #07 ECDF
- #08 Grupp. Boxplot · #09 Ridgeline · #10 Raincloud · #11 Dot+CI · #12 Bar Chart
- **Ergebnis:** Univariate + Gruppen-Perspektive komplett, Chooser nutzbar

### M3 — Beziehungen (6 Module)
- #14 LOESS · #15 Hexbin/2D-Hist · #16 2D Density · #17 Bubble · #18 Mosaic · #29 Sankey
- `tools/precompute.py` für LOESS/KDE-Stützpunkte
- **Ergebnis:** Bivariate Analyse komplett

### M4 — Hochdimensional (5 Module + neuer Datensatz)
- `product_metrics.csv` generieren; PCA/t-SNE/UMAP vorberechnen → `projections.json`
- #19 Heatmap · #20 Pair Plot · #21 Parallel Coords · #22 PCA · #23 t-SNE/UMAP
- **Ergebnis:** ML-Brücke komplett

### M5 — Zeit, Komposition & Geo (5 Module)
- #25 Small Multiples · #26 Kalender-Heatmap · #27 Stacked Bar · #28 Treemap · #30 Choropleth
- Bundesländer-GeoJSON + Aggregat-Daten
- **Ergebnis: alle 30 Module live**

### M6 — QA & Politur
- QA: alle Module auf Mobil + Desktop durchklicken, Ladezeiten, tote Links
- README-Galerie, Lizenzdatei
- **Ergebnis:** veröffentlichungsreif, LinkedIn-tauglich

## 5. Aufwandsschätzung

| Meilenstein | Umfang | Sessions* |
|-------------|--------|-----------|
| M0 | App-Gerüst + Modul #01 + Aufräumen | 1–2 |
| M1 | 3 Module | 1 |
| M2 | 10 Module | 2–3 |
| M3 | 6 Module + Precompute | 2 |
| M4 | 5 Module + Datensatz | 2 |
| M5 | 5 Module + Geo | 2 |
| M6 | QA + Politur | 1 |
| **Gesamt** | **App + 30 Module** | **11–13** |

\* Module sind stark templatisiert (Config statt Code) — der Aufwand pro Modul sinkt nach M0 deutlich.

## 6. Risiken

| Risiko | Wahrsch. | Gegenmaßnahme |
|--------|----------|---------------|
| Vercel-Projekt-Settings kollidieren mit `vercel.json` (z. B. abweichendes Root Directory) | niedrig | `vercel.json` ist die eine Quelle der Wahrheit; Dashboard-Overrides entfernen |
| 5.000-Zeilen-CSV (~250 KB) bei jedem Seitenaufruf | niedrig | Einmal laden, im Modul-Wechsel wiederverwenden (SPA-artiger Router); ggf. abgespecktes JSON |
| Plotly-Lücken (Hexbin, Mosaic, Beeswarm, Kalender) | mittel | Lösungen pro Fall definiert (siehe Tabelle §2); notfalls statisches Bild + Snippet |
| Scope-Kriechen bei 30 Modulen Content | mittel | Content-Config erzwingt einheitlichen, begrenzten Umfang pro Modul |

## 7. Arbeitsweise

- Entwicklung auf `claude/data-viz-learning-env-s46isl`, ein Commit pro Arbeitspaket
- Jeder Meilenstein endet mit lauffähigem Stand (keine halbfertigen Module im Pfad sichtbar)
- **Review-Punkte:** nach M0 (Design + Modul-Aufbau), nach M2 (Chooser-Logik) — Rest ist Fließband
