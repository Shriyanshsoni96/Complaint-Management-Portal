import { getAssetUrl } from '../../utils/getAssetUrl.js';

function ComplaintSummary({ complaint, timeline }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-6 text-sm sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="text-gray-400 dark:text-gray-500">Department</p>
          <p className="text-gray-900 dark:text-gray-100">{complaint.department?.departmentName}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500">Category</p>
          <p className="text-gray-900 dark:text-gray-100">{complaint.category?.categoryName}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500">Priority</p>
          <p className="text-gray-900 dark:text-gray-100">{complaint.priority}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500">Assigned To</p>
          <p className="text-gray-900 dark:text-gray-100">
            {complaint.assignedTo?.name || 'Not yet assigned'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500">Date Created</p>
          <p className="text-gray-900 dark:text-gray-100">
            {new Date(complaint.createdAt).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500">Last Updated</p>
          <p className="text-gray-900 dark:text-gray-100">
            {new Date(complaint.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-gray-400 dark:text-gray-500">Address</p>
          <p className="text-gray-900 dark:text-gray-100">
            {complaint.address}, {complaint.city}, {complaint.state}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-gray-400 dark:text-gray-500">Description</p>
          <p className="text-gray-900 dark:text-gray-100">{complaint.description}</p>
        </div>
        {complaint.resolutionNote && (
          <div className="sm:col-span-2">
            <p className="text-gray-400 dark:text-gray-500">Resolution Notes</p>
            <p className="text-gray-900 dark:text-gray-100">{complaint.resolutionNote}</p>
          </div>
        )}
      </div>

      {complaint.images?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Images</h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {complaint.images.map((image) => (
              <img
                key={image}
                src={getAssetUrl(image)}
                alt="Complaint evidence"
                className="h-24 w-24 rounded-md border border-gray-200 object-cover dark:border-gray-700"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Timeline</h2>
        <ol className="mt-3 flex flex-col gap-3 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
          {timeline.map((entry) => (
            <li key={entry._id}>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {entry.currentStatus}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(entry.createdAt).toLocaleString()} · {entry.updatedBy?.name}
              </p>
              {entry.remarks && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{entry.remarks}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export default ComplaintSummary;
