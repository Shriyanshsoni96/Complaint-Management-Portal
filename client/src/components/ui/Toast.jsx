const TYPE_STYLES = {
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
};

function Toast({ type = 'success', children, onDismiss }) {
  return (
    <div
      role="status"
      className={`animate-toast-slide-in pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${TYPE_STYLES[type]}`}
    >
      <span>{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-current opacity-60 transition-opacity hover:opacity-100"
      >
        &times;
      </button>
    </div>
  );
}

export default Toast;
