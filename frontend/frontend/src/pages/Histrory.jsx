import { useEffect, useState } from "react";
import { getHistory } from "../api";
import Navbar from "../components/Navbar";

function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((loadError) => setError(loadError.message));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard">
        <div className="page-heading">
          <p className="small-label">HISTORY</p>

          <h1>Analysis History</h1>

          <p>
            View your previous AlertIQ security analyses.
          </p>
        </div>

        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="history-card">
          {history.map((item) => (
            <div className="history-row" key={item.id}>
              <div className="history-type">
                <span>🔍</span>

                <div>
                  <strong>{item.source || "Alert"}</strong>
                  <small>{new Date(item.created_at).toLocaleString()}</small>
                </div>
              </div>

              <span
                className={`status ${riskLabel(item.risk_level).toLowerCase()}`}
              >
                {riskLabel(item.risk_level)}
              </span>

              <strong>{item.risk_score}/100</strong>
            </div>
          ))}
          {!history.length && !error && <p className="empty-state">No analyses recorded yet.</p>}
        </div>
      </main>
    </div>
  );
}

function riskLabel(level) {
  if (level === "critical") return "Scam";
  if (level === "medium") return "Suspicious";
  return "Safe";
}

export default History;