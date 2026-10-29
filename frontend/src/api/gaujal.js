const API_BASE = "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getDashboard() {
  return request("/api/dashboard");
}

export function getReadings() {
  return request("/api/readings");
}

export function runScenario(scenario) {
  return request("/api/simulate/scenario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
}

export function controlSimulation(action) {
  if (!["start", "pause", "reset"].includes(action)) {
    throw new Error("Invalid simulation action");
  }

  return request(`/api/simulation/${action}`, { method: "POST" });
}

export function collectRainwater(litres) {
  return request("/api/simulate/rain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ litres: Number(litres) }),
  });
}