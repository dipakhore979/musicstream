import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { FullScreenSpinner } from "../ui/Spinner.jsx";

// Wrap routes that need a session. Pass roles={["admin"]} to also require a role (used in Phase 3).
export default function ProtectedRoute({ roles }) {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  if (!initialized) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
