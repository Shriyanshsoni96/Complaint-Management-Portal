import { useEffect, useState } from 'react';
import * as categoryService from '../../services/categoryService.js';
import * as departmentService from '../../services/departmentService.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { TableSkeletonRows } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = { categoryName: '', department: '' };

function ManageCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = () =>
    Promise.all([categoryService.getCategories(), departmentService.getDepartments()])
      .then(([categoriesResult, departmentsResult]) => {
        setCategories(categoriesResult.data.categories);
        setDepartments(departmentsResult.data.departments);
        setError('');
      })
      .catch(() => {
        setError('Failed to load categories.');
      })
      .finally(() => {
        setLoading(false);
      });

  useEffect(() => {
    loadData();
  }, []);

  const openCreateForm = () => {
    setEditingCategory(null);
    setForm({ categoryName: '', department: departments[0]?._id || '' });
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);
    setForm({ categoryName: category.categoryName, department: category.department?._id || '' });
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
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory._id, form);
        showToast('Category updated.', { type: 'success' });
      } else {
        await categoryService.createCategory(form);
        showToast('Category added.', { type: 'success' });
      }
      setFormOpen(false);
      await loadData();
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
      await categoryService.deleteCategory(deleteTarget._id);
      showToast('Category deleted.', { type: 'success' });
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Categories</h1>
        <Button onClick={openCreateForm} disabled={departments.length === 0}>
          Add Category
        </Button>
      </div>

      {departments.length === 0 && !loading && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          Create a department first before adding categories.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableSkeletonRows columns={3} />
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                  No categories found. Create your first category.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category._id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {category.categoryName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {category.department?.departmentName || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditForm(category)}
                      className="mr-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
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
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <Input
            id="categoryName"
            name="categoryName"
            label="Category name"
            required
            value={form.categoryName}
            onChange={handleFormChange}
          />
          <Select
            id="department"
            name="department"
            label="Department"
            required
            value={form.department}
            onChange={handleFormChange}
          >
            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.departmentName}
              </option>
            ))}
          </Select>
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
        title="Delete category"
        message={`Are you sure you want to delete "${deleteTarget?.categoryName}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirming={deleting}
      />
    </div>
  );
}

export default ManageCategoriesPage;
