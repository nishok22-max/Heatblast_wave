#!/usr/bin/env python3
"""
HEATSHIELD Backend REST API Server
Provides HTTP API endpoints for the Heatwave Early Warning & Thermal Stress Intelligence Platform.

Endpoints:
  GET /api/health           - Server health check & status
  GET /api/heat-data        - Complete HeatData object for dataset (query: dataset=historical|live)
  GET /api/weather          - Hourly weather & thermal indices (query: dataset=historical|live)
  GET /api/wards            - Ward H3 geometry & risk ranking (query: dataset=historical|live)
  GET /api/ward-detail      - Detailed metrics for specific H3 cell (query: h3=xxx&hour=14)
  GET /api/scenarios        - Intervention simulator scenarios (query: dataset=historical|live)
  GET /api/advisory         - Public warning advisory & CAP 1.2 XML (query: dataset=historical|live)
"""

import os
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DATA_DIR = os.path.join(BASE_DIR, "web", "data")
LIVE_DATA_DIR = os.path.join(WEB_DATA_DIR, "live")

def load_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def load_dataset(mode="historical"):
    target_dir = LIVE_DATA_DIR if mode == "live" else WEB_DATA_DIR
    meta = load_json(os.path.join(target_dir, "meta.json"))
    hexes = load_json(os.path.join(target_dir, "hexes.geojson"))
    hourly = load_json(os.path.join(target_dir, "hourly.json"))
    city = load_json(os.path.join(target_dir, "city.json"))
    personas = load_json(os.path.join(target_dir, "personas.json"))
    advisory = load_json(os.path.join(target_dir, "advisory.json"))
    insights = load_json(os.path.join(target_dir, "insights.json"))
    return {
        "meta": meta,
        "hexes": hexes,
        "hourly": hourly,
        "city": city,
        "personas": personas,
        "advisory": advisory,
        "insights": insights,
    }

class HEATSHIELDRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        dataset_mode = query.get("dataset", ["historical"])[0]

        if path == "/" or path == "/api/health":
            self._set_headers(200)
            res = {
                "status": "ok",
                "server": "HEATSHIELD Thermal Intelligence API",
                "version": "1.0.0",
                "city": "Ahmedabad",
                "mode": dataset_mode,
            }
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        elif path == "/api/heat-data":
            try:
                data = load_dataset(dataset_mode)
                self._set_headers(200)
                self.wfile.write(json.dumps(data).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/weather":
            try:
                data = load_dataset(dataset_mode)
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "meta": data["meta"],
                    "city": data["city"],
                    "hourly_meta": data["hourly"]["meta"],
                }).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/wards":
            try:
                data = load_dataset(dataset_mode)
                self._set_headers(200)
                self.wfile.write(json.dumps(data["hexes"]).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/ward-detail":
            try:
                h3_index = query.get("h3", [None])[0]
                hour = int(query.get("hour", [14])[0])
                data = load_dataset(dataset_mode)

                feature = next(
                    (f for f in data["hexes"]["features"] if f["properties"]["h3_index"] == h3_index),
                    None
                )
                cell_hourly = data["hourly"]["hexes"].get(h3_index) if h3_index else None

                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "h3_index": h3_index,
                    "hour": hour,
                    "feature": feature,
                    "hourly_series": cell_hourly,
                }).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/scenarios":
            try:
                data = load_dataset(dataset_mode)
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "scenarios": data["insights"]["scenarios"],
                    "drivers": data["insights"]["drivers"],
                }).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/advisory":
            try:
                data = load_dataset(dataset_mode)
                self._set_headers(200)
                self.wfile.write(json.dumps(data["advisory"]).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

def run_server(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, HEATSHIELDRequestHandler)
    print(f"HEATSHIELD Backend API Server running on http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down backend server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
