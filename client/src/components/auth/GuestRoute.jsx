import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { FullScreenSpinner } from "../ui/Spinner.jsx";

// Login/signup pages: logged-in users get sent to where they were headed (or Home).
export default function GuestRoute() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();

  if (!initialized) return <FullScreenSpinner />;
  if (user) return <Navigate to={location.state?.from?.pathname || "/"} replace />;

  return <Outlet />;
}
