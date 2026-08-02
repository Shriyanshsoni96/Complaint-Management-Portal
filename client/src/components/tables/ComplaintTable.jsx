import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge.jsx';
import { TableSkeletonRows } from '../ui/Skeleton.jsx';

function ComplaintTable({ complaints, loading, getDetailsPath, emptyMessage }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 font-medium">Tracking ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <TableSkeletonRows columns={5} />
          ) : complaints.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            complaints.map((complaint) => (
              <tr
                key={complaint._id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  <Link
                    to={getDetailsPath(complaint)}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {complaint.complaintId}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{complaint.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={complaint.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{complaint.priority}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintTable;
