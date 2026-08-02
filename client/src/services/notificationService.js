import apiClient from './apiClient.js';

export function getNotifications(params = {}) {
  return apiClient.get('/notifications', { params }).then((res) => res.data);
}

export function markNotificationAsRead(id) {
  return apiClient.patch(`/notifications/${id}/read`).then((res) => res.data);
}

export function deleteNotification(id) {
  return apiClient.delete(`/notifications/${id}`).then((res) => res.data);
}
