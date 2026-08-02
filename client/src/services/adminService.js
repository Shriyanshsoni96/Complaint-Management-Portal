import apiClient from './apiClient.js';

export function getDashboardStats() {
  return apiClient.get('/admin/dashboard').then((res) => res.data);
}

export function getUsers(params = {}) {
  return apiClient.get('/admin/users', { params }).then((res) => res.data);
}

export function updateUser(id, payload) {
  return apiClient.put(`/admin/users/${id}`, payload).then((res) => res.data);
}

export function deleteUser(id) {
  return apiClient.delete(`/admin/users/${id}`).then((res) => res.data);
}

export function assignComplaint(id, payload) {
  return apiClient.patch(`/admin/complaints/${id}/assign`, payload).then((res) => res.data);
}
