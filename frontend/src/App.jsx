import { Navigate, Route, Routes } from "react-router-dom";
import EntryPage from "./pages/EntryPage";
import GamePage from "./pages/GamePage";
import ResultPage from "./pages/ResultPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("arena_user_token");
  const session = localStorage.getItem("arena_session");
  return token && session ? children : <Navigate to="/" replace />;
}

function ResultRoute({ children }) {
  const token = localStorage.getItem("arena_user_token");
  const result = localStorage.getItem("arena_result");
  return token && result ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("arena_admin_token");
  return token ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route
        path="/game"
        element={
          <PrivateRoute>
            <GamePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/result"
        element={
          <ResultRoute>
            <ResultPage />
          </ResultRoute>
        }
      />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
