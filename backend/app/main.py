
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import TankState
from app.services import (
    calculate_level_percent,
    calculate_days_remaining,
    get_water_status,
)
from app.alerts import generate_alerts


from pydantic import BaseModel, Field

from app import simulator




async def simulation_loop():
    while True:
        await asyncio.sleep(10)
        if simulator.get_state()["simulation_running"]:
            simulator.advance_tick()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(simulation_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass





app = FastAPI(
    title="GauJal API",
    description="Smart water monitoring for gaushalas",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "application": "GauJal",
        "status": "healthy",
        "simulation_mode": True,
    }





@app.get("/api/dashboard")
def get_dashboard():
    system = simulator.get_state()

    current_litres = system["current_litres"]
    level_percent = system["level_percent"]
    daily_demand = system["daily_demand_litres"]
    pump_status = system["pump_status"]

    tank = TankState(
        capacity_litres=system["capacity_litres"],
        current_litres=current_litres,
    )

    days_remaining = calculate_days_remaining(
        current_litres, daily_demand
    )
    status = get_water_status(level_percent)

    return {
        "shelter": "Baloda Gaushala",
        "cattle_count": 66,
        "simulation_mode": True,
        "simulation_running": system["simulation_running"],
        "tank": {
            "capacity_litres": tank.capacity_litres,
            "current_litres": tank.current_litres,
            "level_percent": level_percent,
        },
        "water": {
            "estimated_daily_demand_litres": daily_demand,
            "estimated_days_remaining": days_remaining,
        },
        "pump": {
            "status": pump_status,
            "flow_rate_litres_per_hour": 500,
        },
        "status": status,
        "alerts": generate_alerts(level_percent, pump_status),
    }


from fastapi import FastAPI, HTTPException


class ScenarioRequest(BaseModel):
    scenario: str


class RainwaterRequest(BaseModel):
    litres: float = Field(gt=0, le=10000)


@app.get("/api/readings")
def get_readings():
    return {
        "simulation_mode": True,
        "readings": simulator.get_history(),
    }


@app.post("/api/simulate/tick")
def simulate_tick():
    reading = simulator.advance_tick()

    return {
        "message": "Simulation advanced by one hour",
        "reading": reading,
        "dashboard": get_dashboard(),
    }


@app.post("/api/simulate/scenario")
def simulate_scenario(request: ScenarioRequest):
    try:
        reading = simulator.apply_scenario(request.scenario)
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail=str(exc)
        ) from exc

    return {
        "message": f"Scenario '{request.scenario}' applied",
        "reading": reading,
        "dashboard": get_dashboard(),
    }


@app.post("/api/simulate/rain")
def simulate_rain(request: RainwaterRequest):
    reading = simulator.add_rainwater(request.litres)

    return {
        "message": "Rainwater collection simulated",
        "reading": reading,
        "dashboard": get_dashboard(),
    }






@app.post("/api/simulation/start")
def start_simulation():
    return {
        "message": "Simulation resumed",
        "simulation": simulator.start_simulation(),
    }


@app.post("/api/simulation/pause")
def pause_simulation():
    return {
        "message": "Simulation paused",
        "simulation": simulator.pause_simulation(),
    }


@app.post("/api/simulation/reset")
def reset_simulation():
    return {
        "message": "Simulation reset to initial state",
        "simulation": simulator.reset_simulation(),
    }


