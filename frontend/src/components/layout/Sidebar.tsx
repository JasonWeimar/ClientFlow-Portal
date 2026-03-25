import { NavLink } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../lib/utils";
import type { User } from "../../types";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  user?: User | null;
  navItems?: NavItem[];
  onSignOut?: () => void;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: "⊞" },
  { label: "Requests", to: "/admin/requests", icon: "📋" },
  { label: "Settings", to: "/admin/settings", icon: "⚙" },
];

export function Sidebar({
  user,
  navItems = defaultNavItems,
  onSignOut,
}: SidebarProps) {
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <span className="text-base font-bold text-brand-700 tracking-tight">
          ClientFlow
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + sign out */}
      {user && (
        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
          <Avatar initials={initials} size="sm" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-700 truncate">
              {user.email}
            </span>
            <span className="text-xs text-slate-400 capitalize">
              {user.role}
            </span>
          </div>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
