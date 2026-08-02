const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 ${SIZES[size]} ${className}`}
    />
  );
}

export default Spinner;
