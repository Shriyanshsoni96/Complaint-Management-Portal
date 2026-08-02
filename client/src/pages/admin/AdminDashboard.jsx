import { useCallback, useEffect, useState } from 'react';
import * as adminService from '../../services/adminService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import StatCard from '../../components/cards/StatCard.jsx';
import StatusDistributionChart from '../../components/charts/StatusDistributionChart.jsx';
import MonthlyTrendsChart from '../../components/charts/MonthlyTrendsChart.jsx';
import DepartmentPerformanceChart from '../../components/charts/DepartmentPerformanceChart.jsx';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const loadStats = useCallback(
    () =>
      adminService
        .getDashboardStats()
        .then((result) => {
          setStats(result.data);
          setError('');
        })
        .catch(() => setError('Failed to load dashboard stats.')),
    [],
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useSocketEvent('dashboard:update', loadStats);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Complaints" value={stats.totalComplaints} />
            <StatCard label="Pending" value={stats.statusCounts.Pending} />
            <StatCard label="Resolved" value={stats.statusCounts.Resolved} />
            <StatCard label="Active Users" value={stats.activeUsers} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Assigned" value={stats.statusCounts.Assigned} />
            <StatCard label="In Progress" value={stats.statusCounts['In Progress']} />
            <StatCard label="Closed" value={stats.statusCounts.Closed} />
            <StatCard label="Departments" value={stats.totalDepartments} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Complaint Status Distribution</h2>
              <div className="mt-4">
                <StatusDistributionChart statusCounts={stats.statusCounts} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Complaint Trends</h2>
              <div className="mt-4">
                <MonthlyTrendsChart monthlyTrends={stats.monthlyTrends} />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Department Performance</h2>
              <div className="mt-4">
                <DepartmentPerformanceChart departmentPerformance={stats.departmentPerformance} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
