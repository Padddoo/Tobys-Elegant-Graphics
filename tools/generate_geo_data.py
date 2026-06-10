"""Verteilt die 5 Lieferregionen aus shipping_orders_2024.csv auf die
16 Bundesländer (bevölkerungsproportional + Rauschen) und schreibt
docs/data/orders_by_bundesland.csv für die Choropleth-Karte (#30).

Das GeoJSON (docs/data/bundeslaender.geo.json) stammt aus
https://github.com/isellsoap/deutschlandGeoJSON (© GeoBasis-DE / BKG,
dl-de/by-2-0) und ist im Repo eingecheckt.
"""
import numpy as np
import pandas as pd

# Region → [(Bundesland-ID, Name, Bevölkerung in Mio.)]
REGION_STATES = {
    "Nord": [("DE-SH", "Schleswig-Holstein", 2.9), ("DE-HH", "Hamburg", 1.9),
             ("DE-HB", "Bremen", 0.7), ("DE-NI", "Niedersachsen", 8.0),
             ("DE-MV", "Mecklenburg-Vorpommern", 1.6)],
    "Ost": [("DE-BE", "Berlin", 3.7), ("DE-BB", "Brandenburg", 2.5),
            ("DE-SN", "Sachsen", 4.0), ("DE-ST", "Sachsen-Anhalt", 2.2),
            ("DE-TH", "Thüringen", 2.1)],
    "West": [("DE-NW", "Nordrhein-Westfalen", 17.9), ("DE-RP", "Rheinland-Pfalz", 4.1),
             ("DE-SL", "Saarland", 1.0)],
    "Sued": [("DE-BY", "Bayern", 13.2), ("DE-BW", "Baden-Württemberg", 11.1)],
    "Zentral": [("DE-HE", "Hessen", 6.3)],
}

rng = np.random.default_rng(42)
df = pd.read_csv("data/shipping_orders_2024.csv")
agg = df.groupby("region").agg(orders=("order_id", "count"),
                               revenue_eur=("order_value_eur", "sum"))

rows = []
for region, states in REGION_STATES.items():
    pops = np.array([p for _, _, p in states])
    # bevölkerungsproportional, mit ±10 % Rauschen, dann renormiert
    w = pops * rng.normal(1, 0.1, len(pops))
    w = w / w.sum()
    r = agg.loc[region]
    for (sid, name, pop), wi in zip(states, w):
        orders = int(round(r["orders"] * wi))
        rows.append({
            "state_id": sid,
            "state_name": name,
            "region": region,
            "population_mio": pop,
            "orders": orders,
            "revenue_eur": round(r["revenue_eur"] * wi, 2),
            "orders_per_100k": round(orders / (pop * 10), 1),
        })

out = pd.DataFrame(rows)
out.to_csv("docs/data/orders_by_bundesland.csv", index=False)
print(out.sort_values("orders", ascending=False).head(6).to_string(index=False))
print(f"→ docs/data/orders_by_bundesland.csv ({len(out)} Bundesländer)")
