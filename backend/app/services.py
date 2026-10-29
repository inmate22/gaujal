
from app.models import TankState


def calculate_level_percent(tank: TankState) -> float:
    return round(
        (tank.current_litres / tank.capacity_litres) * 100,
        1,
    )


def calculate_days_remaining(
    current_litres: float,
    daily_demand_litres: float,
) -> float | None:
    if daily_demand_litres <= 0:
        return None

    return round(current_litres / daily_demand_litres, 1)


def get_water_status(level_percent: float) -> str:
    if level_percent <= 15:
        return "critical"
    if level_percent <= 40:
        return "low"
    return "normal"
