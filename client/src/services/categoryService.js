import apiClient from './apiClient.js';

export function getCategories(params = {}) {
  return apiClient.get('/categories', { params }).then((res) => res.data);
}

export function createCategory(payload) {
  return apiClient.post('/categories', payload).then((res) => res.data);
}

export function updateCategory(id, payload) {
  return apiClient.put(`/categories/${id}`, payload).then((res) => res.data);
}

export function deleteCategory(id) {
  return apiClient.delete(`/categories/${id}`).then((res) => res.data);
}
