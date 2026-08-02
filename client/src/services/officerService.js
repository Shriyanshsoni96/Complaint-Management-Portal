import apiClient from './apiClient.js';

export function getAssignedComplaints(params = {}) {
  return apiClient.get('/officer/complaints', { params }).then((res) => res.data);
}

export function updateComplaintStatus(id, payload) {
  return apiClient.patch(`/officer/complaints/${id}/status`, payload).then((res) => res.data);
}

export function addResolutionNote(id, resolutionNote) {
  return apiClient
    .patch(`/officer/complaints/${id}/note`, { resolutionNote })
    .then((res) => res.data);
}
