function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-md border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 dark:text-red-400">{error}</span>}
    </div>
  );
}

export default Input;
