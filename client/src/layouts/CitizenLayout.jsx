import DashboardShell from './DashboardShell.jsx';

const navItems = [
  { to: '/citizen/dashboard', label: 'Dashboard' },
  { to: '/citizen/complaints/new', label: 'Create Complaint' },
  { to: '/citizen/complaints', label: 'My Complaints', end: true },
  { to: '/citizen/track', label: 'Track Complaint' },
  { to: '/citizen/notifications', label: 'Notifications' },
];

function CitizenLayout() {
  return <DashboardShell title="CMP" navItems={navItems} />;
}

export default CitizenLayout;
