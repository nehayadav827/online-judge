import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import ProtectedRoute from "./components/ProtectedRoute";

import { useAuthStore }
from "./store/authStore";

function App() {
  const initAuth =
    useAuthStore(
      (state) => state.initAuth
    );

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;