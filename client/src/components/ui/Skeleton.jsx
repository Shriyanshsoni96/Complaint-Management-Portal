function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`} />;
}

export function TableSkeletonRows({ columns, rows = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`skeleton-row-${rowIndex}`}>
      {Array.from({ length: columns }).map((_, colIndex) => (
        <td key={`skeleton-cell-${colIndex}`} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-40" />
        </td>
      ))}
    </tr>
  ));
}

export default Skeleton;
