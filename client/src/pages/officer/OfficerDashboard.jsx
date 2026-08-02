import { useAuth } from '../../context/AuthContext.jsx';

function OfficerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">View and manage your assigned complaints.</p>
    </div>
  );
}

export default OfficerDashboard;
