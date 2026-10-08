import { Download, Home, Search, Library } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/downloads", label: "Downloads", icon: Download },
];
