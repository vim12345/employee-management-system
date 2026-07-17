import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Upload, Trash2, Pencil } from 'lucide-react';
import Shell from '../components/Shell';
import EmployeeFormModal from '../components/EmployeeFormModal';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Employee, Pagination } from '../types';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allManagers, setAllManagers] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('joiningDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWrite = user?.role === 'Super Admin' || user?.role === 'HR Manager';
  const canDelete = user?.role === 'Super Admin';

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: { page, limit: 10, search, department, status, sortBy, order },
      });
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, department, status, sortBy, order]);

  useEffect(() => {
    // fetch a broad list for the "reporting manager" dropdown
    api.get('/employees', { params: { limit: 100 } }).then((res) => setAllManagers(res.data.data));
  }, [showModal]);

  function openCreate() {
    setModalEmployee(null);
    setShowModal(true);
  }

  function openEdit(emp: Employee) {
    setModalEmployee(emp);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Soft-delete this employee? This can be reversed by an administrator.')) return;
    await api.delete(`/employees/${id}`);
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImportMsg('Importing…');
    try {
      const res = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportMsg(`Imported ${res.data.data.created} employees. ${res.data.data.failed.length} failed.`);
      load();
    } catch {
      setImportMsg('Import failed.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold">Employees</h1>
        {canWrite && (
          <div className="flex gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/10 dark:border-white/15"
            >
              <Upload size={16} /> Import CSV
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-signal text-white hover:bg-signal/90"
            >
              <Plus size={16} /> Add Employee
            </button>
          </div>
        )}
      </div>

      {importMsg && <p className="text-sm text-signal mb-4">{importMsg}</p>}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/15 bg-transparent focus:outline-none focus:ring-2 focus:ring-signal"
          />
        </div>
        <input
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          placeholder="Filter department…"
          className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/15 bg-transparent focus:outline-none focus:ring-2 focus:ring-signal w-44"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/15 bg-transparent focus:outline-none focus:ring-2 focus:ring-signal"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/15 bg-transparent focus:outline-none focus:ring-2 focus:ring-signal"
        >
          <option value="joiningDate">Sort: Joining Date</option>
          <option value="name">Sort: Name</option>
        </select>
        <button
          onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/15"
        >
          {order === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50 border-b border-black/5 dark:border-white/10">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-ink/50 dark:text-paper/50">{emp.email}</p>
                  </td>
                  <td className="px-4 py-3">{emp.department}</td>
                  <td className="px-4 py-3">{emp.designation}</td>
                  <td className="px-4 py-3">
                    {typeof emp.reportingManager === 'object' && emp.reportingManager
                      ? emp.reportingManager.name
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'Active'
                          ? 'bg-signal-light text-signal dark:bg-signal/20'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{emp.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(emp)} className="text-ink/50 hover:text-signal">
                        <Pencil size={16} />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(emp._id)} className="text-ink/50 hover:text-danger">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-ink/50 dark:text-paper/50">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <EmployeeFormModal
          employee={modalEmployee}
          managers={allManagers}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </Shell>
  );
}
