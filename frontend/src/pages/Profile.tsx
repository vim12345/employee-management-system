import { useState } from 'react';
import Shell from '../components/Shell';
import EmployeeFormModal from '../components/EmployeeFormModal';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  const rows: [string, string][] = [
    ['Employee ID', user.employeeId],
    ['Name', user.name],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Department', user.department],
    ['Designation', user.designation],
    ['Status', user.status],
    ['Role', user.role],
    ['Joining Date', new Date(user.joiningDate).toLocaleDateString()],
  ];

  return (
    <Shell>
      <h1 className="font-display text-2xl font-semibold mb-6">My Profile</h1>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1e26] p-6 max-w-lg">
        <dl className="space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <dt className="text-ink/50 dark:text-paper/50">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={() => setShowModal(true)}
          className="mt-6 px-4 py-2 text-sm font-medium rounded-lg bg-signal text-white hover:bg-signal/90"
        >
          Edit contact details
        </button>
      </div>

      {showModal && (
        <EmployeeFormModal
          employee={user}
          managers={[]}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            window.location.reload();
          }}
        />
      )}
    </Shell>
  );
}
