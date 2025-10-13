import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Services from "./pages/Services";
import Combos from "./pages/Combos";
import ComboOrders from "./pages/ComboOrders";
import Staff from "./pages/Staff";
import Reviews from "./pages/Reviews";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Article from "./pages/Article";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const FIXED_EMAIL = "admin@luxe.com";
  const FIXED_PASSWORD = "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === FIXED_EMAIL && password === FIXED_PASSWORD) {
      localStorage.setItem("isLoggedIn", "true");
      onLogin(true);
    } else {
      alert("Invalid credentials ❌");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-amber-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-amber-700 mb-6">
          Luxe Hair Admin Login
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@luxe.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" />;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <Router>
      {!isLoggedIn ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={setIsLoggedIn} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="flex h-screen transition-colors duration-300">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <header className="p-4 shadow lg:hidden flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-3 text-lg font-semibold text-amber-700 uppercase">
                Luxe Hair
              </h1>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/appointments"
                    element={
                      <ProtectedRoute>
                        <Appointments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/services"
                    element={
                      <ProtectedRoute>
                        <Services />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/combos"
                    element={
                      <ProtectedRoute>
                        <Combos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <ComboOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/staff"
                    element={
                      <ProtectedRoute>
                        <Staff />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/review"
                    element={
                      <ProtectedRoute>
                        <Reviews />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/message"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/setting"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/article"
                    element={
                      <ProtectedRoute>
                        <Article />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
