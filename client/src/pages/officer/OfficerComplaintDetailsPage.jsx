import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import * as officerService from '../../services/officerService.js';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ComplaintSummary from '../../components/common/ComplaintSummary.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { ALLOWED_STATUS_TRANSITIONS } from '../../constants/complaintStatus.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { useToast } from '../../context/ToastContext.jsx';

function OfficerComplaintDetailsPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nextStatus, setNextStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [resolutionNote, setResolutionNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([complaintService.getComplaintById(id), complaintService.getComplaintTimeline(id)])
        .then(([complaintResult, timelineResult]) => {
          setComplaint(complaintResult.data.complaint);
          setTimeline(timelineResult.data.timeline);
          setResolutionNote(complaintResult.data.complaint.resolutionNote || '');
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

  const allowedNextStatuses = complaint ? ALLOWED_STATUS_TRANSITIONS[complaint.status] || [] : [];

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    if (!nextStatus) return;
    setError('');
    setUpdatingStatus(true);
    try {
      await officerService.updateComplaintStatus(id, { status: nextStatus, remarks: statusRemarks });
      showToast('Complaint status updated.', { type: 'success' });
      setNextStatus('');
      setStatusRemarks('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSavingNote(true);
    try {
      await officerService.addResolutionNote(id, resolutionNote);
      showToast('Resolution note saved.', { type: 'success' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save resolution note.');
    } finally {
      setSavingNote(false);
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

      {allowedNextStatuses.length > 0 && (
        <form
          onSubmit={handleStatusSubmit}
          className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Status</h2>
          <Select
            id="nextStatus"
            name="nextStatus"
            label="New status"
            required
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value)}
          >
            <option value="">Select status</option>
            {allowedNextStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Textarea
            id="statusRemarks"
            name="statusRemarks"
            label="Remarks (optional)"
            rows={3}
            value={statusRemarks}
            onChange={(event) => setStatusRemarks(event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={updatingStatus || !nextStatus}>
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      )}

      <form
        onSubmit={handleNoteSubmit}
        className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
      >
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Note</h2>
        <Textarea
          id="resolutionNote"
          name="resolutionNote"
          rows={3}
          value={resolutionNote}
          onChange={(event) => setResolutionNote(event.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={savingNote}>
            {savingNote ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default OfficerComplaintDetailsPage;
