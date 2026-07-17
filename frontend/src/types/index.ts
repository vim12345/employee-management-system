export type Role = 'Super Admin' | 'HR Manager' | 'Employee';
export type Status = 'Active' | 'Inactive';

export interface ManagerRef {
  _id: string;
  name: string;
  employeeId: string;
  designation: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: Status;
  role: Role;
  reportingManager: ManagerRef | string | null;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  departmentCount: number;
  departmentBreakdown: { department: string; count: number }[];
}

export interface OrgNode {
  _id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  role: Role;
  status: Status;
  children: OrgNode[];
}
