import { io } from 'socket.io-client';
import { TOKEN_KEY } from '../constants/storageKeys.js';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
