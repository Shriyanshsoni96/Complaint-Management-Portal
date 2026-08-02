import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function DashboardShell({ title, navItems }) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 lg:block dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {navLinks}
      </aside>

      {/* Mobile / tablet drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={drawerOpen ? 0 : -1}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`relative flex h-full w-64 flex-col bg-white p-4 shadow-lg transition-transform duration-200 dark:bg-gray-900 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {navLinks}
        </aside>
      </div>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <MenuIcon />
            </button>
            <span className="truncate text-sm text-gray-500 dark:text-gray-400">
              Signed in as {user?.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
