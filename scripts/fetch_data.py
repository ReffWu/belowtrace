"""Download public Detroit layers used by BelowTrace into data/raw/*.geojson.

Usage: python3 scripts/fetch_data.py
"""
import json
import hashlib
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "raw"
COD = "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services"
CIP = "https://utility.arcgis.com/usrsvcs/servers/afe480be72214d84b1ac283f4c3681b3/rest/services/DWSD_Capital_Improvement_Projects_Public_View/FeatureServer"

LAYERS = {
    # DWSD sewer mains with cleaning work orders (partial coverage, "DEV" service may disappear)
    "sewer_gravity_mains_dev": (f"{COD}/Sewer_Cleaning_Dashboard_DEV/FeatureServer/7", "1=1"),
    "sewer_catch_basins_dev": (f"{COD}/Sewer_Cleaning_Dashboard_DEV/FeatureServer/6", "1=1"),
    "sewer_capital_projects": (f"{CIP}/5", "1=1"),
    "sewer_condition_assessment": (f"{CIP}/7", "1=1"),
    "psrp_neighborhoods": (f"{COD}/Neighborhoods_CDBG_DR_Private_Sewer_Repair_Program/FeatureServer/0", "1=1"),
    "city_boundary": (f"{COD}/City_of_Detroit_Boundary/FeatureServer/0", "1=1"),
    "311_water_in_basement": (
        f"{COD}/improve_detroit/FeatureServer/0",
        "request_type IN ('Water In Basement Investigation','Investigate Water in Basement')",
    ),
    "311_sewer_cave_ins": (
        f"{COD}/improve_detroit/FeatureServer/0",
        "request_type IN ('Cave-In over the Sewer','Investigate Cave In (Sink Hole)')",
    ),
}


def get(url, params):
    q = urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f"{url}/query?{q}", timeout=120) as r:
                return json.load(r)
        except Exception:
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"failed: {url}")


def fetch(url, where):
    features, offset = [], 0
    while True:
        page = get(url, {
            "where": where, "outFields": "*", "outSR": 4326, "f": "geojson",
            "resultOffset": offset, "resultRecordCount": 2000,
        })
        batch = page.get("features", [])
        features.extend(batch)
        if not batch or not page.get("properties", {}).get("exceededTransferLimit", len(batch) == 2000):
            break
        offset += len(batch)
    return {"type": "FeatureCollection", "features": features}


def write_manifest(records):
    """Keep a small, versioned receipt for the untracked source downloads."""
    snapshot_dates = [(OUT.parent.parent / record["file"]).stat().st_mtime for record in records]
    manifest = {
        "schemaVersion": 1,
        "snapshotDate": time.strftime("%Y-%m-%d", time.gmtime(max(snapshot_dates))),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "layers": records,
    }
    (OUT.parent / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    for name, (url, where) in LAYERS.items():
        fc = fetch(url, where)
        file = OUT / f"{name}.geojson"
        file.write_text(json.dumps(fc))
        records.append({
            "id": name,
            "endpoint": url,
            "where": where,
            "file": str(file.relative_to(OUT.parent.parent)),
            "featureCount": len(fc["features"]),
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest(),
        })
        print(f"{name}: {len(fc['features'])}")
    write_manifest(records)
