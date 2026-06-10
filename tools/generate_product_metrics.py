"""Erzeugt data/product_metrics.csv — 500 Produkte mit 9 numerischen
Features, eingebauten Korrelationen und Kategorie-Clustern.

Designziele:
- Korrelationsstruktur für #19/#20: Gewicht ↔ Volumen ↔ Versandkosten,
  Preis ↔ Marge (negativ), Preis ↔ Absatz (negativ).
- 5 Kategorie-Cluster für #21–#23: unterschiedliche Zentren pro Kategorie,
  damit PCA/t-SNE/UMAP echte Struktur finden.
"""
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
N_PER_CAT = 100

# Kategorie-Profile: [Gewicht kg, Preis EUR, Retourenquote %, Restock-Tage]
PROFILES = {
    "Electronics": dict(weight=1.2, price=180, returns=6, restock=21),
    "Apparel":     dict(weight=0.4, price=45,  returns=22, restock=10),
    "Home":        dict(weight=6.5, price=70,  returns=5, restock=14),
    "Books":       dict(weight=0.5, price=18,  returns=2, restock=7),
    "Food":        dict(weight=1.8, price=12,  returns=1, restock=3),
}

frames = []
for cat, p in PROFILES.items():
    n = N_PER_CAT
    weight = np.maximum(0.05, rng.lognormal(np.log(p["weight"]), 0.45, n))
    # Volumen korreliert stark mit Gewicht (Dichte variiert)
    volume = np.maximum(0.1, weight * rng.lognormal(np.log(1.8), 0.3, n))
    price = np.maximum(3, rng.lognormal(np.log(p["price"]), 0.4, n))
    # Marge sinkt mit Preis (Wettbewerb bei teuren Artikeln) + Rauschen
    margin = np.clip(38 - 6 * np.log(price) + rng.normal(0, 4, n), 4, 60)
    # Absatz sinkt mit Preis (Elastizität), Food/Books drehen schneller
    base_sales = 900 / (1 + price / 40)
    monthly_sales = np.maximum(5, base_sales * rng.lognormal(0, 0.35, n)).round(0)
    return_rate = np.clip(rng.normal(p["returns"], p["returns"] * 0.35 + 0.5, n), 0, 45)
    # Versandkosten ~ Gewicht + Volumen + Rauschen
    shipping_cost = np.maximum(1.5, 2.2 + 0.9 * weight + 0.35 * volume + rng.normal(0, 0.7, n))
    rating = np.clip(rng.normal(4.1, 0.45, n) - 0.02 * return_rate, 1, 5)
    restock_days = np.maximum(1, rng.normal(p["restock"], p["restock"] * 0.25, n)).round(0)

    frames.append(pd.DataFrame({
        "product_id": [f"P-{cat[:2].upper()}{i:04d}" for i in range(n)],
        "category": cat,
        "weight_kg": weight.round(2),
        "volume_l": volume.round(2),
        "price_eur": price.round(2),
        "margin_pct": margin.round(1),
        "monthly_sales": monthly_sales,
        "return_rate_pct": return_rate.round(1),
        "shipping_cost_eur": shipping_cost.round(2),
        "rating": rating.round(2),
        "restock_days": restock_days,
    }))

df = pd.concat(frames, ignore_index=True).sample(frac=1, random_state=7).reset_index(drop=True)
df.to_csv("data/product_metrics.csv", index=False)
print(f"{len(df)} Produkte → data/product_metrics.csv")
print(df.drop(columns=["product_id", "category"]).corr().round(2).to_string())
