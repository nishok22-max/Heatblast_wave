from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
import asyncio
from contextlib import asynccontextmanager

from api.services.engine import run_live_forecast

# In-memory cache for the live forecast
live_cache = None

async def refresh_forecast_loop():
    global live_cache
    while True:
        try:
            print("Refreshing live forecast in background...")
            # We use asyncio.to_thread because run_live_forecast is synchronous and compute-heavy
            live_cache = await asyncio.to_thread(run_live_forecast, "config/ahmedabad.yaml")
            print("Live forecast refreshed successfully.")
        except Exception as e:
            print(f"Error refreshing live forecast: {e}")
        # Refresh every 4 hours (14400 seconds)
        await asyncio.sleep(14400)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background task
    task = asyncio.create_task(refresh_forecast_loop())
    yield
    # Cancel the task on shutdown
    task.cancel()

app = FastAPI(title="Heatblast API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent.parent / "web" / "data"
LIVE_DIR = DATA_DIR / "live"

def get_data_dir(is_live: bool = False) -> Path:
    return LIVE_DIR if is_live else DATA_DIR

def load_json(filename: str, is_live: bool = False):
    file_path = get_data_dir(is_live) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Data file not found: {filename}")
    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)

# --------------------------------------------------------------------------
# HISTORICAL ENDPOINTS (May 2010 Hindcast)
# --------------------------------------------------------------------------

@app.get("/api/v1/historical/map")
def get_historical_map():
    return load_json("hexes.geojson", is_live=False)

@app.get("/api/v1/historical/summary")
def get_historical_summary():
    return load_json("city.json", is_live=False)

@app.get("/api/v1/historical/hourly")
def get_historical_hourly():
    return load_json("hourly.json", is_live=False)

@app.get("/api/v1/historical/cell/{hex_id}")
def get_historical_cell(hex_id: str):
    hourly = load_json("hourly.json", is_live=False)
    if hex_id not in hourly["hexes"]:
        raise HTTPException(status_code=404, detail="Hex ID not found")
    return {
        "meta": hourly["meta"],
        "data": hourly["hexes"][hex_id]
    }

@app.get("/api/v1/historical/personas")
def get_historical_personas():
    return load_json("personas.json", is_live=False)

@app.get("/api/v1/historical/advisory")
def get_historical_advisory():
    return load_json("advisory.json", is_live=False)

@app.get("/api/v1/historical/insights")
def get_historical_insights():
    return load_json("insights.json", is_live=False)

@app.get("/api/v1/historical/meta")
def get_historical_meta():
    return load_json("meta.json", is_live=False)


# --------------------------------------------------------------------------
# FORECAST ENDPOINTS (Live Mode)
# --------------------------------------------------------------------------

@app.get("/api/v1/forecast/map")
def get_forecast_map():
    if live_cache: return live_cache["map"]
    return load_json("hexes.geojson", is_live=True)

@app.get("/api/v1/forecast/summary")
def get_forecast_summary():
    if live_cache: return live_cache["summary"]
    return load_json("city.json", is_live=True)

@app.get("/api/v1/forecast/hourly")
def get_forecast_hourly():
    if live_cache: return live_cache["hourly"]
    return load_json("hourly.json", is_live=True)

@app.get("/api/v1/forecast/cell/{hex_id}")
def get_forecast_cell(hex_id: str):
    hourly = live_cache["hourly"] if live_cache else load_json("hourly.json", is_live=True)
    if hex_id not in hourly["hexes"]:
        raise HTTPException(status_code=404, detail="Hex ID not found")
    return {
        "meta": hourly["meta"],
        "data": hourly["hexes"][hex_id]
    }

@app.get("/api/v1/forecast/personas")
def get_forecast_personas():
    if live_cache: return live_cache["personas"]
    return load_json("personas.json", is_live=True)

@app.get("/api/v1/forecast/advisory")
def get_forecast_advisory():
    if live_cache: return live_cache["advisory"]
    return load_json("advisory.json", is_live=True)

@app.get("/api/v1/forecast/insights")
def get_forecast_insights():
    if live_cache: return live_cache["insights"]
    return load_json("insights.json", is_live=True)

@app.get("/api/v1/forecast/meta")
def get_forecast_meta():
    if live_cache: return live_cache["meta"]
    return load_json("meta.json", is_live=True)
