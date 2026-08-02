import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import * as departmentService from '../../services/departmentService.js';
import * as categoryService from '../../services/categoryService.js';
import ComplaintFormFields from '../../components/forms/ComplaintFormFields.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function EditComplaintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([complaintService.getComplaintById(id), departmentService.getDepartments()])
      .then(([complaintResult, departmentsResult]) => {
        const complaint = complaintResult.data.complaint;
        setForm({
          title: complaint.title,
          description: complaint.description,
          department: complaint.department?._id || '',
          category: complaint.category?._id || '',
          priority: complaint.priority,
          address: complaint.address,
          city: complaint.city,
          state: complaint.state,
        });
        setDepartments(departmentsResult.data.departments);
      })
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!form?.department) {
      return undefined;
    }

    let cancelled = false;
    categoryService
      .getCategories({ department: form.department })
      .then((result) => {
        if (!cancelled) setCategories(result.data.categories);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load categories.');
      });

    return () => {
      cancelled = true;
    };
  }, [form?.department]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { category: '' } : {}),
    }));
    if (name === 'department' && !value) {
      setCategories([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await complaintService.updateComplaint(id, form);
      showToast('Complaint updated.', { type: 'success' });
      navigate(`/citizen/complaints/${id}`, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Failed to update complaint.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!form) {
    return <p className="text-sm text-red-500 dark:text-red-400">{error || 'Complaint not found.'}</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit Complaint</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <ComplaintFormFields
          form={form}
          onChange={handleChange}
          departments={departments}
          categories={categories}
        />

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditComplaintPage;
