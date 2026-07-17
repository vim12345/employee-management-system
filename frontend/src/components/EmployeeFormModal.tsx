import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import api from '../api/client';
import type { Employee, Role, Status } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  employee: Employee | null; // null = create mode
  managers: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  department: '',
  designation: '',
  salary: '',
  joiningDate: '',
  status: 'Active' as Status,
  role: 'Employee' as Role,
  reportingManager: '',
};

export default function EmployeeFormModal({ employee, managers, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isSelf = employee && user && employee._id === user._id;
  const isEmployeeRole = user?.role === 'Employee';
  const isHR = user?.role === 'HR Manager';

  useEffect(() => {
    if (employee) {
      setForm({
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        password: '',
        department: employee.department,
        designation: employee.designation,
        salary: String(employee.salary),
        joiningDate: employee.joiningDate?.slice(0, 10) ?? '',
        status: employee.status,
        role: employee.role,
        reportingManager:
          typeof employee.reportingManager === 'string'
            ? employee.reportingManager
            : employee.reportingManager?._id ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [employee]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (employee) {
        if (isEmployeeRole) {
          await api.put(`/employees/${employee._id}`, { phone: form.phone });
        } else {
          const payload: Record<string, unknown> = {
            name: form.name,
            email: form.email,
            phone: form.phone,
            department: form.department,
            designation: form.designation,
            salary: Number(form.salary),
            joiningDate: form.joiningDate,
            status: form.status,
            role: form.role,
          };
          if (form.reportingManager) payload.reportingManager = form.reportingManager;
          await api.put(`/employees/${employee._id}`, payload);
        }
      } else {
        await api.post('/employees', {
          ...form,
          salary: Number(form.salary),
          reportingManager: form.reportingManager || undefined,
        });
      }
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong. Please check the form and try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const readOnly = Boolean(employee) && isEmployeeRole; // employees can only edit phone
  const canEditRole = !isEmployeeRole && !(isHR && form.role === 'Super Admin') && !(isHR && employee?.role === 'Super Admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1a1e26] border border-black/5 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
          <h2 className="font-display text-lg font-semibold">
            {employee ? (isSelf ? 'My Profile' : 'Edit Employee') : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="text-ink/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID">
              <input
                required
                disabled={Boolean(employee)}
                value={form.employeeId}
                onChange={(e) => update('employeeId', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Name">
              <input
                required
                disabled={readOnly}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                required
                disabled={readOnly}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Phone">
              <input
                required
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {!employee && (
            <Field label="Temporary Password">
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <input
                required
                disabled={readOnly}
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Designation">
              <input
                required
                disabled={readOnly}
                value={form.designation}
                onChange={(e) => update('designation', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary">
              <input
                type="number"
                min={0}
                required
                disabled={readOnly}
                value={form.salary}
                onChange={(e) => update('salary', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Joining Date">
              <input
                type="date"
                required
                disabled={readOnly}
                value={form.joiningDate}
                onChange={(e) => update('joiningDate', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                disabled={readOnly}
                value={form.status}
                onChange={(e) => update('status', e.target.value as Status)}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Role">
              <select
                disabled={readOnly || !canEditRole}
                value={form.role}
                onChange={(e) => update('role', e.target.value as Role)}
                className={inputClass}
              >
                <option value="Employee">Employee</option>
                <option value="HR Manager">HR Manager</option>
                {!isHR && <option value="Super Admin">Super Admin</option>}
              </select>
            </Field>
          </div>

          <Field label="Reporting Manager">
            <select
              disabled={readOnly}
              value={form.reportingManager}
              onChange={(e) => update('reportingManager', e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {managers
                .filter((m) => !employee || m._id !== employee._id)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} — {m.designation}
                  </option>
                ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-black/10 dark:border-white/15"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-signal text-white hover:bg-signal/90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal disabled:opacity-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1 text-ink/70 dark:text-paper/70">{label}</span>
      {children}
    </label>
  );
}
