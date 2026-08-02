import { createContext, useCallback, useContext, useState } from 'react';
import Toast from '../components/ui/Toast.jsx';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = 'success', duration = 4000 } = {}) => {
      idCounter += 1;
      const id = idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} onDismiss={() => dismissToast(toast.id)}>
            {toast.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
