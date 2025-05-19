import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/" className="logo">
          Instagram Clone
        </Link>

        {isAuthenticated ? (
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to={`/profile/${user?.username}`}>Profile</Link>
            <button onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
