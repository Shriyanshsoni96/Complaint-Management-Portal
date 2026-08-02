import { useCallback, useEffect, useState } from 'react';
import * as officerService from '../../services/officerService.js';
import ComplaintTable from '../../components/tables/ComplaintTable.jsx';
import ComplaintFilters, { emptyComplaintFilters } from '../../components/common/ComplaintFilters.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { toQueryParams } from '../../utils/toQueryParams.js';

function AssignedComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyComplaintFilters);

  const load = useCallback(
    () =>
      officerService
        .getAssignedComplaints(toQueryParams(filters))
        .then((result) => {
          setComplaints(result.data.complaints);
          setError('');
        })
        .catch(() => setError('Failed to load assigned complaints.'))
        .finally(() => setLoading(false)),
    [filters],
  );

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvent('complaint:updated', load);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Assigned Complaints</h1>

      <div className="mt-4">
        <ComplaintFilters onChange={setFilters} showCategory />
      </div>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-4">
        <ComplaintTable
          complaints={complaints}
          loading={loading}
          getDetailsPath={(complaint) => `/officer/complaints/${complaint._id}`}
          emptyMessage="No complaints assigned to you yet."
        />
      </div>
    </div>
  );
}

export default AssignedComplaintsPage;
