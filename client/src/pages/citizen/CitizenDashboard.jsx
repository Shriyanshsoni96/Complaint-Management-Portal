import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';

function CitizenDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Track your complaints or submit a new one.</p>
      <Link to="/citizen/complaints/new" className="mt-4 inline-block">
        <Button>Create Complaint</Button>
      </Link>
    </div>
  );
}

export default CitizenDashboard;
