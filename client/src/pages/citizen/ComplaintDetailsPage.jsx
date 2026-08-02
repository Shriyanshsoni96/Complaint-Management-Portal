import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import ComplaintSummary from '../../components/common/ComplaintSummary.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';

function ComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await complaintService.deleteComplaint(id);
      showToast('Complaint deleted.', { type: 'success' });
      navigate('/citizen/complaints', { replace: true });
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

  const canEdit =
    complaint.createdBy?._id === user?._id && complaint.status === 'Pending' && !complaint.assignedTo;

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

      {canEdit && (
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(`/citizen/complaints/${id}/edit`)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

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

export default ComplaintDetailsPage;
