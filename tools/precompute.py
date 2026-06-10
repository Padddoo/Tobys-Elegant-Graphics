"""Berechnet PCA-, t-SNE- und UMAP-Projektionen von product_metrics.csv
vor und schreibt sie als docs/data/projections.json für die Web-App.

Enthalten:
- pca: skaliert (StandardScaler), 3 Komponenten, Loadings + erklärte Varianz
- pca_unscaled: PCA ohne Skalierung (Gut/Schlecht-Lektion in #22)
- tsne: Perplexity 5 / 30 / 80 (Stabilitäts-Lektion in #23)
- umap: Standard-Parameter
"""
import json

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("data/product_metrics.csv")
features = [c for c in df.columns if c not in ("product_id", "category")]
X = df[features].to_numpy()
Xs = StandardScaler().fit_transform(X)

out = {"features": features, "category": df["category"].tolist()}

# ---- PCA (skaliert) ----
pca = PCA(n_components=3, random_state=0)
P = pca.fit_transform(Xs)
out["pca"] = {
    "x": P[:, 0].round(3).tolist(),
    "y": P[:, 1].round(3).tolist(),
    "z": P[:, 2].round(3).tolist(),
    "explained": [round(v, 4) for v in pca.explained_variance_ratio_],
    "loadings": {f: [round(pca.components_[0, i], 3), round(pca.components_[1, i], 3)]
                 for i, f in enumerate(features)},
}

# ---- PCA (unskaliert — absichtlich falsch, für Gut/Schlecht) ----
pca_u = PCA(n_components=2, random_state=0)
U = pca_u.fit_transform(X)
out["pca_unscaled"] = {
    "x": U[:, 0].round(3).tolist(),
    "y": U[:, 1].round(3).tolist(),
    "explained": [round(v, 4) for v in pca_u.explained_variance_ratio_],
    "dominant": features[int(np.argmax(np.abs(pca_u.components_[0])))],
}

# ---- t-SNE mit drei Perplexities ----
out["tsne"] = {}
for perp in (5, 30, 80):
    T = TSNE(n_components=2, perplexity=perp, random_state=0, init="pca").fit_transform(Xs)
    out["tsne"][f"p{perp}"] = {"x": T[:, 0].round(2).tolist(), "y": T[:, 1].round(2).tolist()}
    print(f"t-SNE perplexity={perp} fertig")

# ---- UMAP ----
try:
    import umap
    Um = umap.UMAP(n_components=2, random_state=0).fit_transform(Xs)
    out["umap"] = {"x": Um[:, 0].round(2).tolist(), "y": Um[:, 1].round(2).tolist()}
    print("UMAP fertig")
except Exception as e:  # noqa: BLE001 — UMAP ist optional
    out["umap"] = None
    print(f"UMAP übersprungen: {e}")

with open("docs/data/projections.json", "w") as f:
    json.dump(out, f)
print("→ docs/data/projections.json")
