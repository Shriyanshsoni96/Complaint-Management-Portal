import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/public/HomePage.jsx';
import NotFoundPage from '../pages/errors/NotFoundPage.jsx';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage.jsx';
import ServerErrorPage from '../pages/errors/ServerErrorPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import CitizenLayout from '../layouts/CitizenLayout.jsx';
import CitizenDashboard from '../pages/citizen/CitizenDashboard.jsx';
import CreateComplaintPage from '../pages/citizen/CreateComplaintPage.jsx';
import ComplaintListPage from '../pages/citizen/ComplaintListPage.jsx';
import ComplaintDetailsPage from '../pages/citizen/ComplaintDetailsPage.jsx';
import EditComplaintPage from '../pages/citizen/EditComplaintPage.jsx';
import TrackComplaintPage from '../pages/citizen/TrackComplaintPage.jsx';
import OfficerLayout from '../layouts/OfficerLayout.jsx';
import OfficerDashboard from '../pages/officer/OfficerDashboard.jsx';
import AssignedComplaintsPage from '../pages/officer/AssignedComplaintsPage.jsx';
import OfficerComplaintDetailsPage from '../pages/officer/OfficerComplaintDetailsPage.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManageUsersPage from '../pages/admin/ManageUsersPage.jsx';
import ManageComplaintsPage from '../pages/admin/ManageComplaintsPage.jsx';
import AdminComplaintDetailsPage from '../pages/admin/AdminComplaintDetailsPage.jsx';
import ManageDepartmentsPage from '../pages/admin/ManageDepartmentsPage.jsx';
import ManageCategoriesPage from '../pages/admin/ManageCategoriesPage.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import NotificationList from '../components/notifications/NotificationList.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { ROLES } from '../constants/roles.js';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/server-error" element={<ServerErrorPage />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]} />}>
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route path="dashboard" element={<CitizenDashboard />} />
          <Route path="complaints" element={<ComplaintListPage />} />
          <Route path="complaints/new" element={<CreateComplaintPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailsPage />} />
          <Route path="complaints/:id/edit" element={<EditComplaintPage />} />
          <Route path="track" element={<TrackComplaintPage />} />
          <Route path="notifications" element={<NotificationList />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.OFFICER]} />}>
        <Route path="/officer" element={<OfficerLayout />}>
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="complaints" element={<AssignedComplaintsPage />} />
          <Route path="complaints/:id" element={<OfficerComplaintDetailsPage />} />
          <Route path="notifications" element={<NotificationList />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="complaints" element={<ManageComplaintsPage />} />
          <Route path="complaints/:id" element={<AdminComplaintDetailsPage />} />
          <Route path="departments" element={<ManageDepartmentsPage />} />
          <Route path="categories" element={<ManageCategoriesPage />} />
          <Route path="notifications" element={<NotificationList />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
