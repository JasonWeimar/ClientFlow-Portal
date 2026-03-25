import { Link } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import type { User } from "../../types";

interface NavbarProps {
  user?: User | null;
  onSignOut?: () => void;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <nav className="w-full h-16 bg-white border-b border-slate-200 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-base font-bold text-brand-700 tracking-tight"
        >
          ClientFlow
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">
              {user.email}
            </span>
            <Avatar initials={initials} size="sm" />
            {onSignOut && (
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
