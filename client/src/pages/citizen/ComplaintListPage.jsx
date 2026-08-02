import { useCallback, useEffect, useState } from 'react';
import * as complaintService from '../../services/complaintService.js';
import ComplaintTable from '../../components/tables/ComplaintTable.jsx';
import ComplaintFilters, { emptyComplaintFilters } from '../../components/common/ComplaintFilters.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { toQueryParams } from '../../utils/toQueryParams.js';

function ComplaintListPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyComplaintFilters);

  const load = useCallback(
    () =>
      complaintService
        .getComplaints(toQueryParams(filters))
        .then((result) => {
          setComplaints(result.data.complaints);
          setError('');
        })
        .catch(() => setError('Failed to load complaints.'))
        .finally(() => setLoading(false)),
    [filters],
  );

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvent('complaint:updated', load);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Complaints</h1>

      <div className="mt-4">
        <ComplaintFilters onChange={setFilters} />
      </div>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-4">
        <ComplaintTable
          complaints={complaints}
          loading={loading}
          getDetailsPath={(complaint) => `/citizen/complaints/${complaint._id}`}
          emptyMessage="No complaints found. Create your first complaint."
        />
      </div>
    </div>
  );
}

export default ComplaintListPage;
