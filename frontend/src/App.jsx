import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/employee"
          element={<ProtectedRoute allowedRole="employee"><EmployeeDashboard /></ProtectedRoute>}
        />
        <Route
          path="/manager"
          element={<ProtectedRoute allowedRole="manager"><ManagerDashboard /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
