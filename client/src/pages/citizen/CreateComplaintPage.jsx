import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import * as departmentService from '../../services/departmentService.js';
import * as categoryService from '../../services/categoryService.js';
import ComplaintFormFields from '../../components/forms/ComplaintFormFields.jsx';
import Button from '../../components/ui/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = {
  title: '',
  description: '',
  department: '',
  category: '',
  priority: 'Medium',
  address: '',
  city: '',
  state: '',
};

function CreateComplaintPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    departmentService
      .getDepartments()
      .then((result) => setDepartments(result.data.departments))
      .catch(() => setError('Failed to load departments.'));
  }, []);

  useEffect(() => {
    if (!form.department) {
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
  }, [form.department]);

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

  const handleImagesChange = (event) => {
    setImages(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      images.forEach((file) => formData.append('images', file));

      const result = await complaintService.createComplaint(formData);
      showToast('Complaint submitted.', { type: 'success' });
      navigate(`/citizen/complaints/${result.data.complaint._id}`, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Failed to submit complaint.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Complaint</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Describe the issue and we&apos;ll route it to the right department.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <ComplaintFormFields
          form={form}
          onChange={handleChange}
          departments={departments}
          categories={categories}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="images" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload images (optional)
          </label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="text-sm text-gray-600 dark:text-gray-400"
          />
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateComplaintPage;
