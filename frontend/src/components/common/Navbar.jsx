import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "../../api/authApi";

const Navbar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        CodeArena
      </Link>

      <div className="navbar-links">
        <Link to="/problems">Problems</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {user && <Link to="/compiler">Compiler</Link>}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-user">
              {user.firstName}
            </Link>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-login">Login</Link>
            <Link to="/register" className="navbar-register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;