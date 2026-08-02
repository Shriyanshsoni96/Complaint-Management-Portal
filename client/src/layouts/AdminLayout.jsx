import DashboardShell from './DashboardShell.jsx';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/complaints', label: 'Manage Complaints' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/notifications', label: 'Notifications' },
];

function AdminLayout() {
  return <DashboardShell title="CMP Admin" navItems={navItems} />;
}

export default AdminLayout;
