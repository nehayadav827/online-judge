import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Compiler from "./pages/Compiler";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public */}
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:slug" element={<ProblemDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/compiler" element={<ProtectedRoute><Compiler /></ProtectedRoute>} />

          <Route path="/contests" element={<Contests />} />
<Route path="/contests/:slug" element={<ContestDetail />} />

        </Routes>
      </div>
    </>
  );
}

export default App;