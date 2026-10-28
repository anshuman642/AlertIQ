import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory, getStoredUser } from "../api";
import Navbar from "../components/Navbar";

function Dashboard() {
  const user = getStoredUser() || {};
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((loadError) => setError(loadError.message));
  }, []);

  const safeCount = history.filter((item) => item.risk_level === "low").length;
  const suspiciousCount = history.filter((item) => item.risk_level === "medium").length;
  const scamCount = history.filter((item) => item.risk_level === "critical").length;

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard">
        <div className="dashboard-header">
          <div>
            <p className="small-label">DASHBOARD</p>

            <h1>
              Welcome, {user.name || "User"} 👋
            </h1>

            <p>
              Check suspicious content before you trust it.
            </p>
          </div>

          <Link to="/analyze" className="primary-btn">
            + New Analysis
          </Link>
        </div>

        <div className="stats-grid">
          <Stat icon="🔍" title="Total Scans" value={history.length} />
          <Stat icon="🟢" title="Safe" value={safeCount} />
          <Stat icon="🟡" title="Suspicious" value={suspiciousCount} />
          <Stat icon="🔴" title="Scams" value={scamCount} />
        </div>

        <h2 className="dashboard-title">Analyze Content</h2>

        <div className="analysis-grid">
          <AnalysisCard
            icon="💬"
            title="Message / Email"
            description="Check suspicious messages and emails."
          />

          <AnalysisCard
            icon="🔗"
            title="URL Scanner"
            description="Analyze suspicious links and websites."
          />

          <AnalysisCard
            icon="🖼️"
            title="Screenshot"
            description="Upload screenshots for AI analysis."
          />

          <AnalysisCard
            icon="💼"
            title="Job / Internship"
            description="Check suspicious recruitment offers."
          />

          <AnalysisCard
            icon="💳"
            title="Payment / UPI"
            description="Analyze payment and UPI scams."
          />

          <AnalysisCard
            icon="📄"
            title="Other Content"
            description="Analyze any suspicious text."
          />
        </div>

        <div className="recent-header">
          <h2>Recent Analyses</h2>

          <Link to="/history">View All</Link>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="table-card">
          {history.length ? history.slice(0, 5).map((item) => (
            <AnalysisRow key={item.id} type={item.source || "Alert"} result={riskLabel(item.risk_level)} risk={item.risk_score} date={formatDate(item.created_at)} />
          )) : !error && <p className="empty-state">No analyses yet. Start with a new analysis above.</p>}
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AnalysisCard({ icon, title, description }) {
  return (
    <Link to="/analyze" className="analysis-card">
      <div className="analysis-icon">{icon}</div>

      <h3>{title}</h3>

      <p>{description}</p>

      <span>Analyze →</span>
    </Link>
  );
}

function AnalysisRow({ type, result, risk, date }) {
  const resultClass = result.toLowerCase();

  return (
    <div className="analysis-row">
      <div>
        <strong>{type}</strong>
        <small>{date}</small>
      </div>

      <span className={`status ${resultClass}`}>
        {result}
      </span>

      <strong>{risk}/100</strong>
    </div>
  );
}

function riskLabel(level) {
  if (level === "critical") return "Scam";
  if (level === "medium") return "Suspicious";
  return "Safe";
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default Dashboard;