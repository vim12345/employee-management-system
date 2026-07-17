import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Network, Moon, Sun, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/organization', label: 'Org Chart', icon: Network },
  { to: '/profile', label: 'My Profile', icon: UserCircle },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-paper dark:bg-ink text-ink dark:text-paper">
      <aside className="w-60 shrink-0 border-r border-black/5 dark:border-white/10 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-black/5 dark:border-white/10">
          <div className="h-8 w-8 rounded-lg bg-signal flex items-center justify-center text-white font-display font-bold text-sm">
            EMS
          </div>
          <span className="font-display font-semibold text-sm">Employee Mgmt</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-signal-light text-signal dark:bg-signal/20 dark:text-signal'
                    : 'text-ink/60 dark:text-paper/60 hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-black/5 dark:border-white/10 space-y-1">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/60 dark:text-paper/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-black/5 dark:border-white/10 flex items-center justify-end px-6">
          <div className="text-right">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs text-ink/50 dark:text-paper/50 mt-0.5">{user?.role}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
