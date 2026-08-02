import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import * as adminService from '../../services/adminService.js';
import * as departmentService from '../../services/departmentService.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ComplaintSummary from '../../components/common/ComplaintSummary.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Select from '../../components/ui/Select.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { useToast } from '../../context/ToastContext.jsx';

const NON_ASSIGNABLE_STATUSES = ['Resolved', 'Closed'];

function AdminComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [assignForm, setAssignForm] = useState({ departmentId: '', officerId: '' });
  const [assignError, setAssignError] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([complaintService.getComplaintById(id), complaintService.getComplaintTimeline(id)])
        .then(([complaintResult, timelineResult]) => {
          setComplaint(complaintResult.data.complaint);
          setTimeline(timelineResult.data.timeline);
          setError('');
        })
        .catch(() => setError('Failed to load complaint.'))
        .finally(() => setLoading(false)),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleComplaintUpdated = useCallback(
    (event) => {
      if (event.complaintId === id) load();
    },
    [id, load],
  );

  useSocketEvent('complaint:updated', handleComplaintUpdated);

  const openAssignModal = () => {
    setAssignError('');
    setAssignForm({ departmentId: complaint?.department?._id || '', officerId: '' });
    setOfficers([]);
    setAssignOpen(true);
    departmentService
      .getDepartments()
      .then((result) => setDepartments(result.data.departments))
      .catch(() => setAssignError('Failed to load departments.'));
  };

  useEffect(() => {
    if (!assignForm.departmentId || !assignOpen) {
      return undefined;
    }

    let cancelled = false;
    adminService
      .getUsers({ role: 'officer', department: assignForm.departmentId })
      .then((result) => {
        if (!cancelled) setOfficers(result.data.users.filter((officer) => officer.isActive));
      })
      .catch(() => {
        if (!cancelled) setAssignError('Failed to load officers.');
      });

    return () => {
      cancelled = true;
    };
  }, [assignForm.departmentId, assignOpen]);

  const handleAssignChange = (event) => {
    const { name, value } = event.target;
    setAssignForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'departmentId' ? { officerId: '' } : {}),
    }));
  };

  const handleAssignSubmit = async (event) => {
    event.preventDefault();
    setAssignError('');
    setAssigning(true);
    try {
      await adminService.assignComplaint(id, assignForm);
      showToast('Complaint assigned.', { type: 'success' });
      setAssignOpen(false);
      await load();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await complaintService.deleteComplaint(id);
      showToast('Complaint deleted.', { type: 'success' });
      navigate('/admin/complaints', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete complaint.');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!complaint) {
    return <p className="text-sm text-red-500 dark:text-red-400">{error || 'Complaint not found.'}</p>;
  }

  const canAssign = !NON_ASSIGNABLE_STATUSES.includes(complaint.status);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{complaint.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tracking ID: {complaint.complaintId}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-6">
        <ComplaintSummary complaint={complaint} timeline={timeline} />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {canAssign && (
          <Button variant="secondary" onClick={openAssignModal}>
            {complaint.assignedTo ? 'Reassign Officer' : 'Assign Officer'}
          </Button>
        )}
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Officer">
        <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
          <Select
            id="departmentId"
            name="departmentId"
            label="Department"
            required
            value={assignForm.departmentId}
            onChange={handleAssignChange}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.departmentName}
              </option>
            ))}
          </Select>

          <Select
            id="officerId"
            name="officerId"
            label="Officer"
            required
            disabled={!assignForm.departmentId}
            value={assignForm.officerId}
            onChange={handleAssignChange}
          >
            <option value="">Select officer</option>
            {officers.map((officer) => (
              <option key={officer._id} value={officer._id}>
                {officer.name}
              </option>
            ))}
          </Select>

          {assignForm.departmentId && officers.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No active officers in this department.
            </p>
          )}

          {assignError && <p className="text-sm text-red-500 dark:text-red-400">{assignError}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={assigning}>
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete complaint"
        message="Are you sure you want to delete this complaint? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        confirming={deleting}
      />
    </div>
  );
}

export default AdminComplaintDetailsPage;
