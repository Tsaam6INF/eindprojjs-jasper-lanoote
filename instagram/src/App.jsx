import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && (
          <nav className="sidebar">
            <div className="sidebar-nav">
              <a href="/" className="active">
                <span>🏠</span>
                <span>Home</span>
              </a>
              <a href={`/profile/${user?.username}`}>
                <span>👤</span>
                <span>Profile</span>
              </a>
              <a href="#" onClick={handleLogout}>
                <span>🚪</span>
                <span>Logout</span>
              </a>
            </div>
          </nav>
        )}

        <div className="main-content">
          <Navbar
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />

          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile/:username"
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login
                    setIsAuthenticated={setIsAuthenticated}
                    setUser={setUser}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isAuthenticated ? (
                  <Register
                    setIsAuthenticated={setIsAuthenticated}
                    setUser={setUser}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
