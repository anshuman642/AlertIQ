import { useState } from "react";
import { analyzeContent, analyzeImage } from "../api";
import Navbar from "../components/Navbar";
import RiskCard from "../components/RiskCard";

function Analyze() {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("SMS");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!content.trim() && !url.trim() && !image) {
      setError("Enter message text, a URL, or select an image to analyze.");
      return;
    }

    try {
      setLoading(true);
      const data = image
        ? await analyzeImage(image, content)
        : await analyzeContent({
          message: content.trim() || null,
          url: url.trim() || null,
          source,
        });
      if (data.status === "needs_text") {
        throw new Error(data.message);
      }
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="analyze-page">
        <div className="page-heading">
          <p className="small-label">AI ANALYSIS</p>

          <h1>Analyze Suspicious Content</h1>

          <p>
            Submit suspicious content and let AlertIQ analyze
            potential scam and phishing risks.
          </p>
        </div>

        <form className="analyze-card" onSubmit={handleAnalyze}>
          <label>Content to analyze</label>

          <textarea
            placeholder="Paste the suspicious message, offer, or email here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />

          <label>Related URL</label>

          <input
            type="url"
            placeholder="https://example.com (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || Boolean(image)}
          />

          <label>Source</label>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={loading}
          >
            <option>SMS</option>
            <option>Email</option>
            <option>WhatsApp / Chat</option>
            <option>Job / Internship</option>
            <option>Payment / UPI</option>
            <option>Other</option>
          </select>

          <label htmlFor="analysis-image">Screenshot (optional)</label>
          <input
            id="analysis-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            disabled={loading}
          />
          <p className="field-hint">For screenshots, add the visible text above. Supported: JPEG, PNG, WEBP, GIF (up to 8 MB).</p>

          {error && <p role="alert" className="form-error">{error}</p>}

          <button className="primary-btn analyze-btn" disabled={loading}>
            {loading ? "Analyzing..." : "🔍 Analyze with AlertIQ"}
          </button>
        </form>

        {result && <RiskCard result={result} />}
      </main>
    </div>
  );
}

export default Analyze;