
def generate_alerts(
    level_percent: float,
    pump_status: str,
) -> list[dict]:
    alerts = []

    if level_percent <= 15:
        alerts.append({
            "severity": "critical",
            "message": "Critical water level. Arrange replenishment immediately.",
        })
    elif level_percent <= 40:
        alerts.append({
            "severity": "warning",
            "message": "Water level is low. Check water replenishment.",
        })

    if pump_status == "failed":
        alerts.append({
            "severity": "critical",
            "message": "Possible pump failure. Inspect the pump and water flow.",
        })

    return alerts
