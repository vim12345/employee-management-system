import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import Shell from '../components/Shell';
import type { DashboardStats } from '../types';

const COLORS = ['#0F6B5C', '#C9822A', '#4C6FD5', '#B3432F', '#7A5CA8', '#2E9E8F'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setErrorMsg('Could not load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: 'Total Employees', value: stats.totalEmployees },
        { label: 'Active Employees', value: stats.activeEmployees },
        { label: 'Inactive Employees', value: stats.inactiveEmployees },
        { label: 'Departments', value: stats.departmentCount },
      ]
    : [];

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">Dashboard</h1>

      {loading && <p className="text-sm text-ink/50 dark:text-paper/50">Loading stats…</p>}
      {errorMsg && <p className="text-sm text-danger">{errorMsg}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] p-5"
              >
                <p className="text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">{c.label}</p>
                <p className="font-display text-3xl font-semibold mt-2">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] p-5">
              <h2 className="font-display text-sm font-semibold mb-4">Employees by department</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.departmentBreakdown}>
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0F6B5C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] p-5">
              <h2 className="font-display text-sm font-semibold mb-4">Department distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.departmentBreakdown}
                    dataKey="count"
                    nameKey="department"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    {stats.departmentBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
