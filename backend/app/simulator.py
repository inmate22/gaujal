
from datetime import datetime, timezone

CAPACITY_LITRES = 10_000
NORMAL_HOURLY_DEMAND = 50
HIGH_HOURLY_DEMAND = 200
PUMP_FLOW_LPH = 500
MAX_HISTORY = 100

state = {
    "current_litres": 4200.0,
    "daily_demand_litres": 1200.0,
    "pump_status": "standby",
    "demand_mode": "normal",
    "rainwater_inflow_litres": 0.0,
    "simulation_running": True,
}

history = []


def record_reading(consumed_litres=0.0, added_litres=0.0):
    """Record the current simulated tank state."""
    level = state["current_litres"] / CAPACITY_LITRES * 100

    reading = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "current_litres": round(state["current_litres"], 1),
        "level_percent": round(level, 1),
        "consumed_litres": round(consumed_litres, 1),
        "added_litres": round(added_litres, 1),
        "pump_status": state["pump_status"],
    }

    history.append(reading)

    if len(history) > MAX_HISTORY:
        del history[:-MAX_HISTORY]

    return reading



def get_state():
    hourly_demand = (
        HIGH_HOURLY_DEMAND
        if state["demand_mode"] == "high"
        else NORMAL_HOURLY_DEMAND
    )

    return {
        **state,
        "capacity_litres": CAPACITY_LITRES,
        "hourly_demand_litres": hourly_demand,
        "daily_demand_litres": hourly_demand * 24,
        "level_percent": round(
            state["current_litres"] / CAPACITY_LITRES * 100, 1
        ),
    }



def get_history():
    return list(history)


def advance_tick():
    """Advance the simulation by one simulated hour."""

    if not state["simulation_running"]:
        return record_reading()

    demand = (
        HIGH_HOURLY_DEMAND
        if state["demand_mode"] == "high"
        else NORMAL_HOURLY_DEMAND
    )

    consumed = min(state["current_litres"], demand)
    state["current_litres"] -= consumed

    # Rainwater is added only when explicitly simulated.
    added = min(
        state["rainwater_inflow_litres"],
        CAPACITY_LITRES - state["current_litres"],
    )
    state["current_litres"] += added
    state["rainwater_inflow_litres"] = 0.0

    return record_reading(consumed_litres=consumed, added_litres=added)


def apply_scenario(scenario: str):
    """Apply a named demonstration scenario."""

    if scenario == "low_water":
        state["current_litres"] = 1200.0

    elif scenario == "pump_failure":
        state["pump_status"] = "failed"

    elif scenario == "high_demand":
        state["demand_mode"] = "high"

    elif scenario == "refill":
        added = min(
            2500.0,
            CAPACITY_LITRES - state["current_litres"],
        )
        state["current_litres"] += added
        state["pump_status"] = "standby"
        state["demand_mode"] = "normal"
        return record_reading(added_litres=added)

    elif scenario == "reset":
        state["current_litres"] = 4200.0
        state["daily_demand_litres"] = 1200.0
        state["pump_status"] = "standby"
        state["demand_mode"] = "normal"
        state["rainwater_inflow_litres"] = 0.0
        history.clear()

    else:
        raise ValueError(
            "Unknown scenario. Use low_water, pump_failure, "
            "high_demand, refill, or reset."
        )

    return record_reading()


def add_rainwater(litres: float):
    """Simulate a rainwater collection event."""
    added = min(
        litres,
        CAPACITY_LITRES - state["current_litres"],
    )
    state["current_litres"] += added
    return record_reading(added_litres=added)


# Seed history so charts have an initial data point.
record_reading()


def start_simulation():
    state["simulation_running"] = True
    return get_state()


def pause_simulation():
    state["simulation_running"] = False
    return get_state()


def reset_simulation():
    state["current_litres"] = 4200.0
    state["daily_demand_litres"] = 1200.0
    state["pump_status"] = "standby"
    state["demand_mode"] = "normal"
    state["rainwater_inflow_litres"] = 0.0
    state["simulation_running"] = True

    history.clear()
    record_reading()

    return get_state()

