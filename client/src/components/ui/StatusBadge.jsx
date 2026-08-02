const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  Assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'In Progress': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  Resolved: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Closed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
