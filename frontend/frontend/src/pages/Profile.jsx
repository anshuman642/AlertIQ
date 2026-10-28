import { useEffect, useState } from "react";
import { getHistory, getStoredUser } from "../api";
import Navbar from "../components/Navbar";

function Profile() {
  const user = getStoredUser() || {};
  const [analysisCount, setAnalysisCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory()
      .then((history) => setAnalysisCount(history.length))
      .catch((loadError) => setError(loadError.message));
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard">
        <div className="page-heading">
          <p className="small-label">ACCOUNT</p>

          <h1>My Profile</h1>
        </div>

        <div className="profile-card">
          <div className="avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>

          <h2>{user.name || "User"}</h2>

          <p>{user.email || "No email available"}</p>

          <div className="profile-info">
            <div>
              <span>Account Status</span>
              <strong>Active</strong>
            </div>

            <div>
              <span>Total Analyses</span>
              <strong>{analysisCount}</strong>
            </div>
          </div>
          {error && <p role="alert" className="form-error">{error}</p>}
        </div>
      </main>
    </div>
  );
}

export default Profile;