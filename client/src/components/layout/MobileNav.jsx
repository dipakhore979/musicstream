import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems.js";

export default function MobileNav() {
  return (
    <nav className="grid grid-cols-3 border-t border-white/10 bg-black pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
              isActive ? "text-white" : "text-muted"
            }`
          }
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
