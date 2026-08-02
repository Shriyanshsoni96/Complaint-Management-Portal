import { Pie } from 'react-chartjs-2';
import { useChartColors } from './chartTheme.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const STATUS_ORDER = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

function StatusDistributionChart({ statusCounts }) {
  const { theme } = useTheme();
  const { categorical, legendLabelDefaults } = useChartColors();

  const data = {
    labels: STATUS_ORDER,
    datasets: [
      {
        data: STATUS_ORDER.map((status) => statusCounts[status] || 0),
        backgroundColor: categorical.slice(0, STATUS_ORDER.length),
        borderColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: legendLabelDefaults,
      },
      tooltip: {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
  };

  const total = STATUS_ORDER.reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
        No complaint data yet.
      </p>
    );
  }

  return (
    <div style={{ height: 260 }}>
      <Pie data={data} options={options} />
    </div>
  );
}

export default StatusDistributionChart;
