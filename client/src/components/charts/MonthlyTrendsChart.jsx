import { Line } from 'react-chartjs-2';
import { useChartColors } from './chartTheme.js';

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short' });

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return MONTH_LABEL_FORMATTER.format(new Date(year, month - 1, 1));
}

function MonthlyTrendsChart({ monthlyTrends }) {
  const { categorical, ink, axisTickDefaults } = useChartColors();

  const data = {
    labels: monthlyTrends.map((entry) => formatMonthLabel(entry.month)),
    datasets: [
      {
        label: 'Complaints submitted',
        data: monthlyTrends.map((entry) => entry.count),
        borderColor: categorical[0],
        backgroundColor: categorical[0],
        pointBackgroundColor: categorical[0],
        pointRadius: 4,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // Single series - the chart title already names it, no legend box needed.
      legend: { display: false },
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
      <Line data={data} options={options} />
    </div>
  );
}

export default MonthlyTrendsChart;
