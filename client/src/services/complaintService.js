import apiClient from './apiClient.js';

export function createComplaint(formData) {
  return apiClient
    .post('/complaints', formData, { headers: { 'Content-Type': undefined } })
    .then((res) => res.data);
}

export function getComplaints(params = {}) {
  return apiClient.get('/complaints', { params }).then((res) => res.data);
}

export function getComplaintById(id) {
  return apiClient.get(`/complaints/${id}`).then((res) => res.data);
}

export function trackComplaint(complaintId) {
  return apiClient.get(`/complaints/track/${complaintId}`).then((res) => res.data);
}

export function getComplaintTimeline(id) {
  return apiClient.get(`/complaints/${id}/timeline`).then((res) => res.data);
}

export function updateComplaint(id, payload) {
  return apiClient.put(`/complaints/${id}`, payload).then((res) => res.data);
}

export function deleteComplaint(id) {
  return apiClient.delete(`/complaints/${id}`).then((res) => res.data);
}
