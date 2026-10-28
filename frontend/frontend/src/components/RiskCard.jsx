function RiskCard({ result }) {
  const { risk_score: risk, risk_level: level, source, summary, indicators, recommendations } = result;
  const classification = level === "critical" ? "Scam" : level === "medium" ? "Suspicious" : "Safe";
  const className = classification.toLowerCase();

  return (
    <div className={`risk-result ${className}`}>
      <div className="result-top">
        <div>
          <p className="small-label">ANALYSIS RESULT</p>

          <h2>
            {classification === "Scam" && "🔴 "}
            {classification === "Suspicious" && "🟡 "}
            {classification === "Safe" && "🟢 "}

            {classification}
          </h2>

          <p>Source: {source}</p>
        </div>

        <div className="risk-score">
          <strong>{risk}</strong>
          <span>/100</span>
        </div>
      </div>

      <div className="result-section">
        <h3>Why is this risky?</h3>

        {indicators.length > 0 ? (
          <ul>
            {indicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
          </ul>
        ) : (
          <p>{summary}</p>
        )}
      </div>

      <div className="recommendation">
        <h3>🛡️ Safety Recommendation</h3>

        <ul>{recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul>
      </div>
    </div>
  );
}

export default RiskCard;