import { useEffect, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import * as departmentService from '../../services/departmentService.js';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { TableSkeletonRows } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLES } from '../../constants/roles.js';

const ROLE_OPTIONS = [ROLES.CITIZEN, ROLES.OFFICER, ROLES.ADMIN];

const emptyForm = { role: '', department: '', isActive: true };

function ManageUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = () =>
    Promise.all([adminService.getUsers(), departmentService.getDepartments()])
      .then(([usersResult, departmentsResult]) => {
        setUsers(usersResult.data.users);
        setDepartments(departmentsResult.data.departments);
        setError('');
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openEditForm = (targetUser) => {
    setEditingUser(targetUser);
    setForm({
      role: targetUser.role,
      department: targetUser.department?._id || '',
      isActive: targetUser.isActive,
    });
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'role' ? { department: '' } : {}),
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { role: form.role, isActive: form.isActive === true || form.isActive === 'true' };
      if (form.role === ROLES.OFFICER) {
        payload.department = form.department;
      }
      await adminService.updateUser(editingUser._id, payload);
      showToast('User updated.', { type: 'success' });
      setEditingUser(null);
      await load();
    } catch (err) {
      setFormError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Failed to update user.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await adminService.deleteUser(deactivateTarget._id);
      showToast('User deactivated.', { type: 'success' });
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user.');
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Users</h1>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableSkeletonRows columns={6} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((targetUser) => (
                <tr
                  key={targetUser._id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{targetUser.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{targetUser.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-500 dark:text-gray-400">
                    {targetUser.role}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {targetUser.department?.departmentName || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {targetUser.isActive ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(targetUser)}
                      className="mr-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Edit
                    </button>
                    {targetUser.isActive && (
                      <button
                        type="button"
                        onClick={() => setDeactivateTarget(targetUser)}
                        className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Edit ${editingUser?.name || ''}`}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Select id="role" name="role" label="Role" required value={form.role} onChange={handleFormChange}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>

          {form.role === ROLES.OFFICER && (
            <Select
              id="department"
              name="department"
              label="Department"
              required
              value={form.department}
              onChange={handleFormChange}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.departmentName}
                </option>
              ))}
            </Select>
          )}

          <Select
            id="isActive"
            name="isActive"
            label="Status"
            value={String(form.isActive)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          {formError && <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate user"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name}"? They will no longer be able to sign in.`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        confirming={deactivating}
      />
    </div>
  );
}

export default ManageUsersPage;
