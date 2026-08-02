import apiClient from './apiClient.js';

export function register(payload) {
  return apiClient.post('/auth/register', payload).then((res) => res.data);
}

export function login(payload) {
  return apiClient.post('/auth/login', payload).then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout').then((res) => res.data);
}

export function getCurrentUser() {
  return apiClient.get('/auth/me').then((res) => res.data);
}

export function changePassword(payload) {
  return apiClient.patch('/auth/change-password', payload).then((res) => res.data);
}
