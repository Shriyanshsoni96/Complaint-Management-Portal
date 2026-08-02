import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../constants/roles.js';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';

const dashboardByRole = {
  [ROLES.CITIZEN]: '/citizen/dashboard',
  [ROLES.OFFICER]: '/officer/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
        Complaint Management Portal
      </h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Register complaints, track progress, and get resolutions faster.
      </p>
      <div className="mt-6 flex gap-3">
        {isAuthenticated ? (
          <Link
            to={dashboardByRole[user.role] || '/'}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
