import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

// `handler` should be stable (wrap in useCallback) to avoid resubscribing on every render.
export function useSocketEvent(eventName, handler) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return undefined;
    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
}
