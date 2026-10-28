import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Landing() {
  return (
    <div>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            🛡️ AI-Powered Digital Safety
          </div>

          <h1>
            Detect Scams.
            <br />
            <span>Stay Safe.</span>
          </h1>

          <p>
            AlertIQ uses AI, NLP and Machine Learning to analyze
            suspicious messages, URLs, emails, screenshots and job offers.
          </p>

          <div className="hero-buttons">
            <Link to="/signup" className="primary-btn">
              Start Analysis
            </Link>

            <Link to="/login" className="secondary-btn">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="scan-header">
            <span>AlertIQ Analysis</span>
            <span className="live-dot">●</span>
          </div>

          <div className="risk-circle">
            <strong>92</strong>
            <small>/100</small>
          </div>

          <h3>⚠️ Scam Detected</h3>

          <p>
            Suspicious phishing patterns detected in submitted content.
          </p>

          <div className="mini-reason">
            <span>✓</span> Urgency-based language
          </div>

          <div className="mini-reason">
            <span>✓</span> Suspicious payment request
          </div>

          <div className="mini-reason">
            <span>✓</span> Possible impersonation
          </div>
        </div>
      </section>

      <section className="features">
        <h2>What can AlertIQ analyze?</h2>

        <p className="section-subtitle">
          Check suspicious digital content before taking action.
        </p>

        <div className="feature-grid">
          <Feature icon="💬" title="Messages" />
          <Feature icon="📧" title="Emails" />
          <Feature icon="🔗" title="URLs" />
          <Feature icon="🖼️" title="Screenshots" />
          <Feature icon="💼" title="Job Offers" />
          <Feature icon="💳" title="Payment & UPI" />
        </div>
      </section>

      <section className="how-section">
        <h2>How AlertIQ Works</h2>

        <div className="steps">
          <Step number="01" title="Submit" text="Enter or upload suspicious content." />
          <Step number="02" title="Analyze" text="AI analyzes multiple risk factors." />
          <Step number="03" title="Understand" text="Get risk score and clear reasons." />
          <Step number="04" title="Stay Safe" text="Follow personalized safety recommendations." />
        </div>
      </section>

      <footer>
        <strong>AlertIQ</strong>
        <p>Detect. Understand. Stay Safe.</p>
      </footer>
    </div>
  );
}

function Feature({ icon, title }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>Analyze suspicious {title.toLowerCase()} with AlertIQ.</p>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default Landing;