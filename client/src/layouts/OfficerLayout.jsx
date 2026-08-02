import DashboardShell from './DashboardShell.jsx';

const navItems = [
  { to: '/officer/dashboard', label: 'Dashboard' },
  { to: '/officer/complaints', label: 'Assigned Complaints' },
  { to: '/officer/notifications', label: 'Notifications' },
];

function OfficerLayout() {
  return <DashboardShell title="CMP Officer" navItems={navItems} />;
}

export default OfficerLayout;
