import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Waves,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  collectRainwater,
  controlSimulation,
  getDashboard,
  getReadings,
  runScenario,
} from "./api/gaujal";
import "./index.css";

function formatLitres(value) {
  return `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })} L`;
}

function StatCard({ icon: Icon, label, value, detail, tone = "green" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <p className="stat-label">{label}</p>
      <h2>{value}</h2>
      <p className="stat-detail">{detail}</p>
    </article>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rainLitres, setRainLitres] = useState("500");
  const [notice, setNotice] = useState("");
  const [litresPerAnimal, setLitresPerAnimal] = useState("18.2");
  const [dailyRainwater, setDailyRainwater] = useState("500");
  const [conservationPercent, setConservationPercent] = useState(15);

  const refreshData = useCallback(async () => {
    try {
      const [dashboardData, readingsData] = await Promise.all([
        getDashboard(),
        getReadings(),
      ]);
      setDashboard(dashboardData);
      setReadings(readingsData.readings || []);
      setError("");
    } catch (err) {
      setError(
        "Cannot connect to GauJal API. Check that the FastAPI backend is running on port 8000.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 2500);
    return () => clearInterval(timer);
  }, [refreshData]);

  async function performAction(action, label) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      await refreshData();
      setNotice(label);
    } catch (err) {
      setError(err.message || "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const tank = dashboard?.tank;
  const water = dashboard?.water;
  const pump = dashboard?.pump;
  const level = tank?.level_percent ?? 0;
  const status = dashboard?.status ?? "normal";
  const isCritical = status === "critical";
  const isLow = status === "low";
  const alerts = dashboard?.alerts || [];

  const chartData = readings.map((reading, index) => ({
    ...reading,
    time: new Date(reading.timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    label: `Reading ${index + 1}`,
  }));

  const simulationRunning = dashboard?.simulation_running ?? true;

  const cattleCount = dashboard?.cattle_count ?? 66;
const availableWater = tank?.current_litres ?? 0;

const demandPerAnimal = Math.max(0, Number(litresPerAnimal) || 0);
const rainwaterPerDay = Math.max(0, Number(dailyRainwater) || 0);

const estimatedDailyDemand = cattleCount * demandPerAnimal;
const dailySavings =
  estimatedDailyDemand * (conservationPercent / 100);

const demandAfterConservation =
  estimatedDailyDemand - dailySavings;

const effectiveDailyDemand = Math.max(
  0,
  demandAfterConservation - rainwaterPerDay
);

const baselineDays =
  estimatedDailyDemand > 0
    ? availableWater / estimatedDailyDemand
    : null;

const conservationDays =
  effectiveDailyDemand > 0
    ? availableWater / effectiveDailyDemand
    : null;

const rainwaterCoverage =
  estimatedDailyDemand > 0
    ? Math.min(100, (rainwaterPerDay / estimatedDailyDemand) * 100)
    : 0;

const conservationExtension =
  baselineDays !== null && conservationDays !== null
    ? conservationDays - baselineDays
    : null;

const litresSavedPerDay = dailySavings;

  if (loading && !dashboard) {
    return (
      <main className="loading-screen">
        <div className="loading-mark"><Droplets size={30} /></div>
        <h1>GauJal</h1>
        <p>Connecting to the water monitoring system…</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Droplets size={25} /></div>
          <div>
            <h1>GauJal</h1>
            <span>SMART WATER SYSTEM</span>
          </div>
        </div>

        <div className="side-section-label">WORKSPACE</div>
        <div className="nav-item active">
          <Gauge size={19} />
          <span>Overview</span>
        </div>
        <div className="nav-item">
          <Waves size={19} />
          <span>Water monitoring</span>
        </div>
        <div className="nav-item">
          <CloudRain size={19} />
          <span>Rainwater harvesting</span>
        </div>
        <div className="nav-item">
          <Activity size={19} />
          <span>Simulation lab</span>
        </div>

        <div className="sidebar-bottom">
          <div className="eco-card">
            <div className="eco-icon"><Leaf size={19} /></div>
            <h3>Every drop matters.</h3>
            <p>Smarter water management for healthier gaushalas.</p>
          </div>
          <div className="sidebar-foot">
            <span className="online-dot" /> GauJal prototype v0.1
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="topbar-right">
            <span className="demo-badge"><span /> SIMULATION MODE</span>
            <div className="avatar">GJ</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">WATER RESOURCE MANAGEMENT</p>
              <h1>Gaushala overview</h1>
              <p className="subtitle">
                Monitor water availability, anticipate shortages, and explore
                conservation scenarios.
              </p>
            </div>
            <div className="site-chip">
              <div className="site-chip-icon"><ShieldCheck size={20} /></div>
              <div>
                <strong>Baloda Gaushala</strong>
                <span>66 cattle · Demo site</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="message error-message">
              <AlertTriangle size={18} /> {error}
            </div>
          )}
          {notice && (
            <div className="message success-message">
              <ShieldCheck size={18} /> {notice}
            </div>
          )}

          <section className="status-banner">
            <div className={`status-symbol ${isCritical ? "critical" : isLow ? "low" : ""}`}>
              {isCritical || isLow ? <AlertTriangle size={23} /> : <Droplets size={23} />}
            </div>
            <div className="status-copy">
              <strong>
                {isCritical
                  ? "Critical water level"
                  : isLow
                    ? "Water level is running low"
                    : "Water system operating normally"}
              </strong>
              <span>
                {isCritical
                  ? "Immediate replenishment is recommended in this simulation."
                  : isLow
                    ? "Consider replenishing the tank to maintain a safe reserve."
                    : "Water availability is above the low-level alert threshold."}
              </span>
            </div>
            <div className={`status-pill ${isCritical ? "pill-critical" : isLow ? "pill-low" : ""}`}>
              <span /> {status.toUpperCase()}
            </div>
          </section>

          <section className="stats-grid">
            <StatCard
              icon={Droplets}
              label="CURRENT WATER"
              value={formatLitres(tank?.current_litres)}
              detail={`${level}% of total tank capacity`}
              tone="blue"
            />
            <StatCard
              icon={Gauge}
              label="TANK CAPACITY"
              value={formatLitres(tank?.capacity_litres)}
              detail="Illustrative storage capacity"
              tone="green"
            />
            <StatCard
              icon={Activity}
              label="DAYS REMAINING"
              value={water?.estimated_days_remaining == null
                ? "—"
                : `${water.estimated_days_remaining} days`}
              detail={`Estimated demand: ${formatLitres(water?.estimated_daily_demand_litres)}/day`}
              tone="orange"
            />
            <StatCard
              icon={Zap}
              label="PUMP STATUS"
              value={pump?.status === "failed" ? "Failure" : pump?.status === "running" ? "Running" : "Standby"}
              detail={`${pump?.flow_rate_litres_per_hour ?? 500} L/hour nominal flow`}
              tone={pump?.status === "failed" ? "red" : "green"}
            />
          </section>

          <section className="dashboard-grid">
            <article className="panel tank-panel">
              <div className="panel-heading">
                <div>
                  <h2>Water storage</h2>
                  <p>Current tank level and reserve</p>
                </div>
                <span className="live-label"><span /> LIVE</span>
              </div>

              <div className="tank-layout">
                <div className="tank-visual-wrap">
                  <div className="tank-visual">
                    <div className="tank-top" />
                    <div
                      className={`tank-water ${isCritical ? "water-critical" : isLow ? "water-low" : ""}`}
                      style={{ height: `${Math.max(0, Math.min(level, 100))}%` }}
                    >
                      <div className="water-wave wave-one" />
                      <div className="water-wave wave-two" />
                    </div>
                    <div className="tank-gloss" />
                  </div>
                  <div className="tank-base" />
                </div>

                <div className="tank-reading">
                  <span className="reading-label">TANK FILL LEVEL</span>
                  <div className="big-percentage">{level}<small>%</small></div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${isCritical ? "fill-critical" : isLow ? "fill-low" : ""}`}
                      style={{ width: `${Math.max(0, Math.min(level, 100))}%` }}
                    />
                  </div>
                  <div className="scale-row"><span>0 L</span><span>{formatLitres(tank?.capacity_litres)}</span></div>
                  <div className="reading-divider" />
                  <div className="mini-metric">
                    <span>Available water</span><strong>{formatLitres(tank?.current_litres)}</strong>
                  </div>
                  <div className="mini-metric">
                    <span>Daily demand</span><strong>{formatLitres(water?.estimated_daily_demand_litres)}</strong>
                  </div>
                </div>
              </div>
              <div className="tank-footnote">
                <span className="info-dot">i</span>
                Level thresholds: critical ≤15%, low ≤40%, normal above 40%.
              </div>
            </article>

            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Water level history</h2>
                  <p>Simulated readings over time</p>
                </div>
                <div className="chart-legend"><span /> Water level (L)</div>
              </div>
              {chartData.length > 1 ? (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#149d8a" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#149d8a" stopOpacity={0.015} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e9efed" strokeDasharray="4 5" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: "#87958f", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis domain={[0, "auto"]} tick={{ fill: "#87958f", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: "1px solid #e5ece8", fontSize: 12 }}
                        formatter={(value) => [formatLitres(value), "Water"]}
                        labelStyle={{ color: "#56665f", marginBottom: 4 }}
                      />
                      <Area type="monotone" dataKey="current_litres" stroke="#149d8a" strokeWidth={2.5} fill="url(#waterGradient)" activeDot={{ r: 5, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-chart">
                  <Activity size={28} />
                  <strong>Building your water history</strong>
                  <span>Readings will appear as the simulation advances.</span>
                </div>
              )}
              <div className="chart-footer">
                <span><span className="chart-dot" /> Recorded readings: {readings.length}</span>
                <span>Auto-refresh every 2.5 sec</span>
              </div>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel controls-panel">
              <div className="panel-heading">
                <div>
                  <h2>Simulation controls</h2>
                  <p>Test system responses in a safe demo environment</p>
                </div>
                <span className="sim-tag">DEMO</span>
              </div>

              <div className="control-row">
                <div>
                  <strong>Time progression</strong>
                  <span>One simulation tick represents one hour</span>
                </div>
                <div className="button-group">
                  <button
                    className="button button-muted"
                    disabled={busy || simulationRunning}
                    onClick={() => performAction(() => controlSimulation("start"), "Simulation resumed.")}
                  >
                    <Play size={15} /> Resume
                  </button>
                  <button
                    className="button button-muted"
                    disabled={busy || !simulationRunning}
                    onClick={() => performAction(() => controlSimulation("pause"), "Simulation paused.")}
                  >
                    <Pause size={15} /> Pause
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => performAction(() => controlSimulation("reset"), "Simulation reset to its initial state.")}
                  >
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>
              </div>

              <div className="control-divider" />
              <div className="scenario-heading">
                <strong>Run a scenario</strong>
                <span>Observe how the dashboard reacts</span>
              </div>
              <div className="scenario-grid">
                <button className="scenario-button" disabled={busy} onClick={() => performAction(() => runScenario("low_water"), "Low-water scenario activated.")}>
                  <span className="scenario-icon orange-bg"><Droplets size={18} /></span>
                  <span><strong>Low water</strong><small>Set tank to 12%</small></span>
                </button>
                <button className="scenario-button" disabled={busy} onClick={() => performAction(() => runScenario("pump_failure"), "Pump-failure scenario activated.")}>
                  <span className="scenario-icon red-bg"><Zap size={18} /></span>
                  <span><strong>Pump failure</strong><small>Trigger pump alert</small></span>
                </button>
                <button className="scenario-button" disabled={busy} onClick={() => performAction(() => runScenario("high_demand"), "High-demand scenario activated.")}>
                  <span className="scenario-icon purple-bg"><Activity size={18} /></span>
                  <span><strong>High demand</strong><small>Increase consumption</small></span>
                </button>
                <button className="scenario-button" disabled={busy} onClick={() => performAction(() => runScenario("refill"), "Tank refill scenario completed.")}>
                  <span className="scenario-icon blue-bg"><ArrowDownToLine size={18} /></span>
                  <span><strong>Refill tank</strong><small>Add up to 2,500 L</small></span>
                </button>
              </div>
            </article>

            <article className="panel rain-panel">
              <div className="panel-heading">
                <div>
                  <h2>Rainwater harvesting</h2>
                  <p>Simulate captured rainwater entering the tank</p>
                </div>
                <div className="rain-icon"><CloudRain size={21} /></div>
              </div>
              <div className="rain-feature">
                <div className="rain-feature-icon"><CloudRain size={25} /></div>
                <div>
                  <strong>Capture. Store. Conserve.</strong>
                  <span>Supplement water reserves through collection.</span>
                </div>
              </div>
              <label className="input-label" htmlFor="rain-litres">Collected rainwater (litres)</label>
              <div className="rain-input-row">
                <input
                  id="rain-litres"
                  type="number"
                  min="1"
                  max="10000"
                  step="100"
                  value={rainLitres}
                  onChange={(event) => setRainLitres(event.target.value)}
                />
                <button
                  className="button button-primary"
                  disabled={busy || !rainLitres || Number(rainLitres) <= 0 || Number(rainLitres) > 10000}
                  onClick={() => performAction(() => collectRainwater(rainLitres), `${Number(rainLitres).toLocaleString("en-IN")} L rainwater added to the simulation.`)}
                >
                  <Droplets size={16} /> Add water
                </button>
              </div>
              <p className="input-help">The tank cannot exceed its {formatLitres(tank?.capacity_litres)} capacity.</p>
              <div className="rain-note">
                <Leaf size={17} />
                <span>Prototype concept: actual collection depends on rainfall, roof area, and storage infrastructure.</span>
              </div>
            </article>
          </section>



          <section className="panel analytics-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">PLANNING & CONSERVATION</p>
                <h2>Water demand & conservation analytics</h2>
                <p>
                  Explore how daily demand, water-saving measures, and rainwater
                  collection could affect the reserve.
                </p>
              </div>
              <div className="analytics-badge">
                <Activity size={16} />
                ESTIMATES
              </div>
            </div>

            <div className="analytics-inputs">
              <div className="analytics-input">
                <label htmlFor="animal-demand">Water per animal / day</label>
                <div className="input-with-unit">
                  <input
                    id="animal-demand"
                    type="number"
                    min="0"
                    max="500"
                    step="0.5"
                    value={litresPerAnimal}
                    onChange={(event) => setLitresPerAnimal(event.target.value)}
                  />
                  <span>L/day</span>
                </div>
                <small>Illustrative assumption, not measured consumption.</small>
              </div>

              <div className="analytics-input">
                <label htmlFor="daily-rainwater">Average collected rainwater / day</label>
                <div className="input-with-unit">
                  <input
                    id="daily-rainwater"
                    type="number"
                    min="0"
                    max="100000"
                    step="100"
                    value={dailyRainwater}
                    onChange={(event) => setDailyRainwater(event.target.value)}
                  />
                  <span>L/day</span>
                </div>
                <small>Assumed average contribution, not a weather forecast.</small>
              </div>

              <div className="analytics-input conservation-input">
                <div className="conservation-label">
                  <label htmlFor="conservation-target">Target demand reduction</label>
                  <strong>{conservationPercent}%</strong>
                </div>
                <input
                  id="conservation-target"
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={conservationPercent}
                  onChange={(event) =>
                    setConservationPercent(Number(event.target.value))
                  }
                />
                <div className="range-labels">
                  <span>0% savings</span>
                  <span>40% savings</span>
                </div>
                <small>Hypothetical target for testing conservation strategies.</small>
              </div>
            </div>

            <div className="analytics-metrics">
              <div className="analytics-metric">
                <span className="metric-icon blue-bg"><Droplets size={18} /></span>
                <span className="metric-title">Estimated daily demand</span>
                <strong>{formatLitres(estimatedDailyDemand)}</strong>
                <small>Across {cattleCount} cattle</small>
              </div>

              <div className="analytics-metric">
                <span className="metric-icon green-bg"><Leaf size={18} /></span>
                <span className="metric-title">Potential daily savings</span>
                <strong>{formatLitres(litresSavedPerDay)}</strong>
                <small>At the selected {conservationPercent}% target</small>
              </div>

              <div className="analytics-metric">
                <span className="metric-icon blue-bg"><CloudRain size={18} /></span>
                <span className="metric-title">Rainwater coverage</span>
                <strong>{rainwaterCoverage.toFixed(1)}%</strong>
                <small>Of estimated daily demand, before savings</small>
              </div>

              <div className="analytics-metric">
                <span className="metric-icon orange-bg"><Gauge size={18} /></span>
                <span className="metric-title">Effective daily demand</span>
                <strong>{formatLitres(effectiveDailyDemand)}</strong>
                <small>After savings and assumed rainwater</small>
              </div>
            </div>

            <div className="reserve-comparison">
              <div className="reserve-heading">
                <div>
                  <h3>Estimated reserve duration</h3>
                  <p>Based on the current tank level of {formatLitres(availableWater)}</p>
                </div>
                <span className="reserve-tag">WHAT-IF ANALYSIS</span>
              </div>

              <div className="reserve-bars">
                <div className="reserve-row">
                  <div className="reserve-row-label">
                    <span>Current-demand baseline</span>
                    <strong>
                      {baselineDays === null ? "—" : `${baselineDays.toFixed(1)} days`}
                    </strong>
                  </div>
                  <div className="reserve-track">
                    <div
                      className="reserve-fill baseline-fill"
                      style={{
                        width: `${baselineDays === null ? 0 : Math.min(100, baselineDays / Math.max(baselineDays || 0, conservationDays || 0, 1) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="reserve-row">
                  <div className="reserve-row-label">
                    <span>With selected conservation and rainwater</span>
                    <strong>
                      {effectiveDailyDemand === 0
                        ? "No net daily deficit*"
                        : `${conservationDays.toFixed(1)} days`}
                    </strong>
                  </div>
                  <div className="reserve-track">
                    <div
                      className="reserve-fill improved-fill"
                      style={{
                        width: `${conservationDays === null ? 100 : Math.min(100, conservationDays / Math.max(baselineDays || 0, conservationDays || 0, 1) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="conservation-result">
                <div className="result-symbol"><Leaf size={19} /></div>
                <div>
                  <strong>
                    {effectiveDailyDemand === 0
                      ? "The selected assumptions cover the estimated daily demand."
                      : conservationExtension !== null && conservationExtension > 0
                        ? `Potentially ${conservationExtension.toFixed(1)} extra days of reserve`
                        : "Review the assumptions to improve reserve duration"}
                  </strong>
                  <p>
                    This compares the current-demand baseline with the selected
                    conservation and rainwater assumptions. It is not a guaranteed
                    water supply forecast.
                  </p>
                </div>
              </div>

              {effectiveDailyDemand === 0 && (
                <p className="analytics-footnote">
                  * A zero net deficit means the assumed daily savings and rainwater
                  contribution meet or exceed estimated demand. Actual supply may still
                  vary, and stored water can still be depleted by other uses or losses.
                </p>
              )}
            </div>
          </section>



          <section className="panel alerts-panel">
            <div className="panel-heading">
              <div>
                <h2>System alerts</h2>
                <p>Actionable notifications based on current simulated conditions</p>
              </div>
              <span className="alert-count">{alerts.length} active</span>
            </div>
            {alerts.length === 0 ? (
              <div className="no-alerts"><ShieldCheck size={19} /><span>No active alerts. All monitored thresholds are within range.</span></div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert, index) => (
                  <div className="alert-item" key={`${alert.message}-${index}`}>
                    <div className={`alert-symbol ${alert.severity === "critical" ? "alert-symbol-critical" : ""}`}>
                      <AlertTriangle size={18} />
                    </div>
                    <div className="alert-text">
                      <strong>{alert.severity === "critical" ? "Critical alert" : "Water warning"}</strong>
                      <span>{alert.message}</span>
                    </div>
                    <span className={`alert-severity ${alert.severity}`}>{alert.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="page-footer">
            <span><Droplets size={15} /> GauJal · Smart water management for gaushalas</span>
            <span><span className="footer-dot" /> Demo data only · No physical sensors connected</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;