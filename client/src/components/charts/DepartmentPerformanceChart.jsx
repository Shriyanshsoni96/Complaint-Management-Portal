import { Bar } from 'react-chartjs-2';
import { useChartColors } from './chartTheme.js';

function DepartmentPerformanceChart({ departmentPerformance }) {
  const { categorical, ink, legendLabelDefaults, axisTickDefaults } = useChartColors();

  if (departmentPerformance.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
        No complaint data yet.
      </p>
    );
  }

  const data = {
    labels: departmentPerformance.map((row) => row.departmentName),
    datasets: [
      {
        label: 'Total complaints',
        data: departmentPerformance.map((row) => row.total),
        backgroundColor: categorical[0],
        borderRadius: 4,
      },
      {
        label: 'Resolved',
        data: departmentPerformance.map((row) => row.resolved),
        backgroundColor: categorical[1],
        borderRadius: 4,
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
    scales: {
      x: {
        grid: { display: false },
        border: { color: ink.baseline },
        ticks: axisTickDefaults,
      },
      y: {
        beginAtZero: true,
        ticks: { ...axisTickDefaults, precision: 0 },
        grid: { color: ink.gridline },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default DepartmentPerformanceChart;
