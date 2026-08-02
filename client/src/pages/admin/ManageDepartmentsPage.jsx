import { useEffect, useState } from 'react';
import * as departmentService from '../../services/departmentService.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { TableSkeletonRows } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = { departmentName: '', description: '' };

function ManageDepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = () =>
    departmentService
      .getDepartments()
      .then((result) => {
        setDepartments(result.data.departments);
        setError('');
      })
      .catch(() => {
        setError('Failed to load departments.');
      })
      .finally(() => {
        setLoading(false);
      });

  useEffect(() => {
    loadDepartments();
  }, []);

  const openCreateForm = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (department) => {
    setEditingDepartment(department);
    setForm({
      departmentName: department.departmentName,
      description: department.description || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment._id, form);
        showToast('Department updated.', { type: 'success' });
      } else {
        await departmentService.createDepartment(form);
        showToast('Department added.', { type: 'success' });
      }
      setFormOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Something went wrong.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await departmentService.deleteDepartment(deleteTarget._id);
      showToast('Department deleted.', { type: 'success' });
      setDeleteTarget(null);
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Departments</h1>
        <Button onClick={openCreateForm}>Add Department</Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableSkeletonRows columns={3} />
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                  No departments found. Create your first department.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr
                  key={department._id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {department.departmentName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {department.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(department)}
                      className="mr-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(department)}
                      className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            id="departmentName"
            name="departmentName"
            label="Department name"
            required
            value={form.departmentName}
            onChange={handleFormChange}
          />
          <Input
            id="description"
            name="description"
            label="Description"
            value={form.description}
            onChange={handleFormChange}
          />
          {formError && <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>}
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete department"
        message={`Are you sure you want to delete "${deleteTarget?.departmentName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}

export default ManageDepartmentsPage;
