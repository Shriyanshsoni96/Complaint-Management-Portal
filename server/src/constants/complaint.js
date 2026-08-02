export const COMPLAINT_STATUS = Object.freeze({
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
});

export const COMPLAINT_STATUS_VALUES = Object.values(COMPLAINT_STATUS);

export const PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EMERGENCY: 'Emergency',
});

export const PRIORITY_VALUES = Object.values(PRIORITY);

export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [COMPLAINT_STATUS.ASSIGNED]: [COMPLAINT_STATUS.IN_PROGRESS],
  [COMPLAINT_STATUS.IN_PROGRESS]: [COMPLAINT_STATUS.RESOLVED],
  [COMPLAINT_STATUS.RESOLVED]: [COMPLAINT_STATUS.CLOSED],
});
