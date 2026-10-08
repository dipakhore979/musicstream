import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Download, Headphones, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore.js";
import { useInstallApp } from "../../hooks/useInstallApp.js";

export function Avatar({ user, size = 32 }) {
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "?";
  if (user?.avatar?.url) {
    return <img src={user.avatar.url} alt={user.name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="flex items-center justify-center rounded-full bg-brand font-bold text-black"
    >
      {initial}
    </div>
  );
}

const LINKS = [
  { to: "/premium", label: "Premium" },
  { to: "/support", label: "Support" },
  { to: "/download", label: "Download" },
];

// Full-width top navbar: logo on the left, links and the account pill on the right.
export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { installed, install } = useInstallApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !menuRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    toast.success("Logged out");
  }

  return (
    <header className="flex h-14 shrink-0 items-stretch justify-between border-b border-brand/30 bg-black">
      <Link to="/" aria-label="MusicStream home" className="group flex items-center gap-2 bg-[#1b1b1b] px-4 text-brand transition-colors hover:bg-[#262626]">
        <Headphones size={26} className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        <span className="font-sans text-xl font-extrabold tracking-tight">MusicStream</span>
      </Link>

      <div className="flex items-center gap-4 pr-4 md:gap-8 md:pr-8">
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative text-base transition-colors hover:text-white after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-brand after:transition-all after:duration-300 hover:after:w-full ${isActive ? "text-white after:w-full" : "text-white/80"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Account menu"
            className="flex max-w-[10rem] items-center gap-1 rounded-full bg-[#f1ead9] px-4 py-1 text-sm text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_6px_18px_-6px_rgba(255,255,255,0.6)]"
          >
            <Avatar user={user} size={22} />
            <span className="truncate">{user?.name?.split(" ")[0] ?? "Account"}</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>

          {open && (
            <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-md bg-surface-highlight p-1 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2">
                <Avatar user={user} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate font-sans text-xs text-muted">{user?.email}</p>
                  {user?.role === "admin" && (
                    <span className="mt-1 inline-block rounded bg-brand/20 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase text-brand">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10 menu-item"
              >
                <UserIcon size={16} /> Profile
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10 menu-item"
                >
                  <ShieldCheck size={16} /> Admin panel
                </Link>
              )}
              {!installed && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    install();
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10 menu-item"
                >
                  <Download size={16} /> Install app
                </button>
              )}
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10 menu-item"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
