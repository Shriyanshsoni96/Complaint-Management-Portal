export const COMPLAINT_STATUS = Object.freeze({
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
});

// Mirrors the backend's transition guard (server/src/constants/complaint.js) so the
// officer UI only ever offers valid next statuses. The server remains the source of truth.
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [COMPLAINT_STATUS.ASSIGNED]: [COMPLAINT_STATUS.IN_PROGRESS],
  [COMPLAINT_STATUS.IN_PROGRESS]: [COMPLAINT_STATUS.RESOLVED],
  [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
});
