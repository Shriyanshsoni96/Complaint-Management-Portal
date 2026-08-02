import apiClient from './apiClient.js';

export function getDepartments() {
  return apiClient.get('/departments').then((res) => res.data);
}

export function createDepartment(payload) {
  return apiClient.post('/departments', payload).then((res) => res.data);
}

export function updateDepartment(id, payload) {
  return apiClient.put(`/departments/${id}`, payload).then((res) => res.data);
}

export function deleteDepartment(id) {
  return apiClient.delete(`/departments/${id}`).then((res) => res.data);
}
