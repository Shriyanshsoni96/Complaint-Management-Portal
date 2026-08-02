import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as complaintService from '../../services/complaintService.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

function TrackComplaintPage() {
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await complaintService.trackComplaint(complaintId.trim());
      navigate(`/citizen/complaints/${result.data.complaint._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'No complaint found with that tracking ID.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Track Complaint</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Enter your complaint tracking ID to view its current status.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          id="complaintId"
          name="complaintId"
          label="Tracking ID"
          placeholder="CMP-20260728-AB12CD"
          required
          value={complaintId}
          onChange={(event) => setComplaintId(event.target.value)}
        />
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Searching...' : 'Track'}
        </Button>
      </form>
    </div>
  );
}

export default TrackComplaintPage;
