# Projektplan: Toby's Elegant Graphics

> Umsetzungsplan für die im README spezifizierten **30 Elegant Graphics for Data Analysis** —
> ein Colab-Notebook pro Use Case, mit Beispiel-Datensätzen, gerenderten Bildern und README-Verlinkung.

**Stand:** 2026-06-10 · **Spec:** [README.md](README.md) · **Branch:** `claude/data-viz-learning-env-s46isl`

---

## 1. Ziel & Scope (aus der Spec)

Für jeden der 30 Use Cases entsteht:

1. ein **Colab-Notebook** mit kommentiertem Python-Code (läuft eigenständig, lädt Daten von GitHub)
2. ein **realistischer Datensatz** in `/data/`
3. ein **gerendertes Beispiel-Bild** in `/images/`
4. eine **README-Sektion**: Wann nutzen? Was zeigt es? Wo sind die Fallstricke?

**Nicht im Scope** (bewusst, laut Spec): Web-Apps, Frameworks, Server, Build-Pipelines.

**Lernziele** (Erfolgskriterien des Projekts):
- In 5 Minuten die richtige Visualisierung für einen neuen Datensatz wählen können
- Trade-offs jeder Grafik kennen
- Eine Bibliothek wiederverwendbarer Code-Snippets besitzen

---

## 2. Spec-Review: Festgestellte Lücken & Entscheidungen

Beim Durchgehen der Spec sind folgende Punkte aufgefallen, die der Plan adressiert:

| # | Befund | Entscheidung im Plan |
|---|--------|---------------------|
| G1 | **Doppelte Struktur**: Alle Dateien liegen sowohl im Repo-Root als auch unter `tobys-elegant-graphics/` | Konsolidierung auf Root-Layout (`data/`, `notebooks/`, `images/` direkt im Repo-Root), Unterordner entfernen → M0 |
| G2 | **Datensatz-Lücke Hochdimensional**: `shipping_orders_2024.csv` hat nur 2 numerische Spalten — zu wenig für #19 Heatmap, #20 Pair Plot, #21 Parallel Coords, #22 PCA, #23 t-SNE/UMAP | Zweiter Datensatz mit 8–12 numerischen Features (z. B. `product_metrics.csv`: Gewicht, Volumen, Marge, Retourenquote, …) → M4 |
| G3 | **Datensatz-Lücke Geo**: #30 Choropleth braucht Geo-Bezug; 5 Grobregionen sind zu wenig | Mapping-Tabelle Region → Bundesländer + aggregierte Bestellwerte je Bundesland (`orders_by_bundesland.csv`) → M5 |
| G4 | **Paket-Risiken**: `ptitprince` (Raincloud) und `joypy` (Ridgeline) sind schwach gepflegt und kollidieren z. T. mit aktuellem seaborn | Fallback einplanen: Raincloud/Ridgeline notfalls manuell mit seaborn/matplotlib bauen; Versionen in requirements pinnen → M2 |
| G5 | **Colab-Datenladen**: Notebooks brauchen stabile Raw-URLs auf GitHub | Standard-Loader-Zelle im Notebook-Template, URL zeigt auf `main` → M0 |
| G6 | `.DS_Store` im Repo | In `.gitignore` aufnehmen, Datei entfernen → M0 |

---

## 3. Ziel-Struktur des Repos

```
tobys-elegant-graphics/            (Repo-Root)
├── README.md                      ← Spec + Use-Case-Katalog mit Colab-Badges
├── PROJECT_PLAN.md                ← Dieser Plan
├── requirements.txt
├── .gitignore
├── data/
│   ├── shipping_orders_2024.csv   ← vorhanden (5.000 Bestellungen)
│   ├── product_metrics.csv        ← neu (M4, hochdimensional)
│   └── orders_by_bundesland.csv   ← neu (M5, Geo)
├── notebooks/
│   ├── 01_histogramm.ipynb
│   ├── 02_density_kde.ipynb
│   ├── …
│   └── 30_choropleth.ipynb
└── images/
    ├── 01_histogramm.png
    └── …
```

---

## 4. Notebook-Template (einheitlich für alle 30)

Jedes Notebook folgt derselben Struktur — das ist der Kern der Wiederverwendbarkeit:

1. **Titel + „Open in Colab"-Badge**
2. **Die Frage** — welche analytische Frage beantwortet diese Grafik? (1 Absatz)
3. **Setup & Daten laden** — Standard-Loader-Zelle (pandas, Raw-URL, `head()`)
4. **Minimalbeispiel** — die Grafik in ≤ 5 Zeilen („das Copy-Paste-Snippet")
5. **Elegante Version** — beschriftet, aufgeräumt, präsentationstauglich
6. **Fallstricke & Trade-offs** — was die Grafik verschweigt, typische Fehler (mit Negativ-Beispiel)
7. **Varianten** — 1–2 sinnvolle Abwandlungen (z. B. Histogramm: Bins, Dichte-Normierung, log-Skala)
8. **Übung** — eine offene Aufgabe am Datensatz mit ausklappbarer Lösung

**Definition of Done pro Notebook:**
- [ ] Läuft in frischem Colab von oben nach unten ohne Fehler durch
- [ ] Lädt Daten ausschließlich über GitHub-Raw-URL (kein lokaler Pfad)
- [ ] Elegante Version als PNG in `images/` exportiert
- [ ] README: Zeile in der Use-Case-Tabelle mit Colab-Badge verlinkt
- [ ] Durcharbeitszeit ≤ 15 Minuten

---

## 5. Meilensteine & Arbeitspakete

Reihenfolge folgt der empfohlenen Lernreihenfolge aus der Spec (Cluster 1–5); die nicht
geclusterten Use Cases sind thematisch passend einsortiert.

### M0 — Fundament & Repo-Hygiene
- Struktur konsolidieren (G1), `.DS_Store` entfernen, `.gitignore` ergänzen (G6)
- `notebooks/`- und `images/`-Ordner anlegen
- Notebook-Template als `00_template.ipynb` festschreiben (inkl. Standard-Loader, G5)
- requirements.txt: Versionen prüfen/pinnen
- **Ergebnis:** Sauberes Repo, in dem jedes weitere Notebook nach Schema F entsteht

### M1 — Brot-und-Butter-Set (4 Notebooks)
> Spec-Cluster 1 „Fundament" — deckt 70 % aller EDA-Situationen ab
- #01 Histogramm · #03 Boxplot · #13 Scatter · #24 Line Chart
- Alle auf `shipping_orders_2024.csv`
- **Ergebnis:** Erster vollständiger Durchstich Notebook → Bild → README-Badge; Template validiert

### M2 — Verteilungen & Gruppenvergleich (10 Notebooks)
> Spec-Cluster 2 + Kategorie B
- #02 Density · #04 Violin · #05 Strip/Jitter · #06 Beeswarm · #07 ECDF
- #08 Gruppierter Boxplot · #09 Ridgeline · #10 Raincloud · #11 Dot Plot mit CI · #12 Bar Chart
- Paket-Risiko G4 hier lösen (joypy/ptitprince testen, ggf. manuelle Implementierung)
- **Ergebnis:** Komplette univariate + Gruppen-Perspektive

### M3 — Beziehungen zwischen Variablen (6 Notebooks)
> Spec-Cluster 3 (ohne Heatmap/Pair Plot, die brauchen den neuen Datensatz)
- #14 Scatter + LOESS · #15 Hexbin · #16 2D Density · #17 Bubble · #18 Mosaic
- #29 Sankey (Region → Carrier → Kategorie fließt gut aus den Shipping-Daten, daher vorgezogen)
- **Ergebnis:** Bivariate Analyse komplett

### M4 — Hochdimensional (5 Notebooks + neuer Datensatz)
- `product_metrics.csv` konstruieren (G2): 8–12 numerische Features, eingebaute Korrelationen und Cluster, damit PCA/UMAP etwas zu finden haben
- #19 Korrelations-Heatmap · #20 Pair Plot · #21 Parallel Coordinates · #22 PCA · #23 t-SNE/UMAP
- **Ergebnis:** Brücke zu ML-Datensätzen

### M5 — Zeit, Komposition & Geo (5 Notebooks + Geo-Daten)
- #25 Small Multiples · #26 Kalender-Heatmap · #27 Stacked Bar (100 %) · #28 Treemap
- `orders_by_bundesland.csv` + GeoJSON-Quelle klären (G3), dann #30 Choropleth
- **Ergebnis:** Alle 30 Use Cases abgedeckt

### M6 — Qualitätssicherung & Politur
- Alle 30 Notebooks einmal frisch in Colab durchlaufen lassen (DoD-Check)
- README final: alle Badges, Bilder-Galerie, Datensatz-Doku für die 2 neuen CSVs
- Lizenzdatei (MIT) ergänzen
- **Ergebnis:** Repo veröffentlichungsreif

---

## 6. Aufwandsschätzung

| Meilenstein | Umfang | Geschätzte Sessions* |
|-------------|--------|---------------------|
| M0 | Setup | 1 |
| M1 | 4 Notebooks | 1 |
| M2 | 10 Notebooks | 2–3 |
| M3 | 6 Notebooks | 1–2 |
| M4 | 5 Notebooks + Datensatz | 2 |
| M5 | 5 Notebooks + Geo-Daten | 2 |
| M6 | QA + Politur | 1 |
| **Gesamt** | **30 Notebooks, 3 Datensätze** | **10–12** |

\* Eine Session ≈ ein fokussierter Arbeitsblock; Notebooks innerhalb eines Meilensteins sind
stark templatisiert, daher sinkt der Aufwand pro Notebook deutlich nach M1.

## 7. Risiken

| Risiko | Wahrscheinlichkeit | Gegenmaßnahme |
|--------|-------------------|---------------|
| `ptitprince`/`joypy` inkompatibel mit aktuellem Colab-Stack | mittel | Manuelle seaborn/matplotlib-Implementierung als Fallback (M2) |
| `umap-learn`-Installation in Colab langsam | niedrig | Install-Zelle mit Hinweis, t-SNE als Sofort-Alternative im selben Notebook |
| GeoJSON-Quelle für Bundesländer (Lizenz/Stabilität) | mittel | Etablierte offene Quelle wählen und Kopie in `data/` einchecken |
| Synthetische Datensätze wirken „zu glatt" | niedrig | Wie beim Shipping-Datensatz: Schiefe, Ausreißer, Saisonalität bewusst einbauen |

## 8. Arbeitsweise

- Entwicklung auf Branch `claude/data-viz-learning-env-s46isl`, ein Commit pro abgeschlossenem Arbeitspaket
- Jeder Meilenstein endet mit lauffähigem Zwischenstand (keine halbfertigen Notebooks auf dem Branch)
- Review-Punkte: nach M0 (Struktur ok?), nach M1 (Template ok?) — danach ist der Rest Fließbandarbeit
