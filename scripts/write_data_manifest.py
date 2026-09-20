"""Write data/manifest.json for an existing BelowTrace open-data snapshot.

Use this after receiving a snapshot outside `fetch_data.py`. The GeoJSON files stay
out of Git, but their source, record count and SHA-256 receipt stay reviewable.
"""
import hashlib
import json
import time
from pathlib import Path
from fetch_data import LAYERS

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"


def main():
    layers, timestamps = [], []
    for name, (endpoint, where) in LAYERS.items():
        file = RAW / f"{name}.geojson"
        payload = file.read_bytes()
        timestamps.append(file.stat().st_mtime)
        layers.append({
            "id": name,
            "endpoint": endpoint,
            "where": where,
            "file": str(file.relative_to(ROOT)),
            "featureCount": len(json.loads(payload)["features"]),
            "sha256": hashlib.sha256(payload).hexdigest(),
        })
    manifest = {
        "schemaVersion": 1,
        "snapshotDate": time.strftime("%Y-%m-%d", time.gmtime(max(timestamps))),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "layers": layers,
    }
    (ROOT / "data" / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
