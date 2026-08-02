import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { connectSocket, disconnectSocket } from '../socket/socketClient.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return undefined;
    }

    const instance = connectSocket();
    if (!instance) return undefined;

    function handleConnect() {
      setSocket(instance);
    }

    instance.on('connect', handleConnect);
    if (instance.connected) {
      // Already connected (e.g. a reused instance) - 'connect' won't fire again,
      // so pick it up on the next microtask instead of setting state synchronously here.
      Promise.resolve().then(handleConnect);
    }

    return () => {
      instance.off('connect', handleConnect);
      disconnectSocket();
      setSocket(null);
    };
  }, [isAuthenticated]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
