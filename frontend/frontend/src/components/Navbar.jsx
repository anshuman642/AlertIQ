import { Link, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../api";

function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAuthenticated = Boolean(user && localStorage.getItem("alertiq_token"));

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span>⚡</span> AlertIQ
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/history">History</Link>
            <Link to="/profile">Profile</Link>

            <button onClick={logout} className="nav-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="nav-signup">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;