# EMS API Documentation

Base URL (local): `http://localhost:5000/api`

Authentication uses a JWT, returned in the login response body and also set as an
httpOnly cookie (`token`). The frontend sends it as a Bearer token; either transport is
accepted by the `authenticate` middleware.

All endpoints except `/auth/login` require a valid token. Include it as:

```
Authorization: Bearer <token>
```

---

## Auth

### POST /api/auth/login
Body:
```json
{ "email": "admin@ems.com", "password": "Admin@123" }
```
Response `200`:
```json
{ "message": "Login successful", "token": "...", "user": { "...": "employee fields, password omitted" } }
```
`401` on bad credentials, `403` if the account is Inactive.

### POST /api/auth/logout
Requires auth. Clears the auth cookie.

### GET /api/auth/me
Requires auth. Returns the current authenticated user.

---

## Employees

### GET /api/employees
Query params (all optional):

| Param      | Description                                   | Default      |
|------------|------------------------------------------------|--------------|
| `page`     | Page number                                     | `1`          |
| `limit`    | Page size (max 100)                             | `10`         |
| `search`   | Matches name or email (case-insensitive)        | —            |
| `department` | Exact department filter                      | —            |
| `role`     | `Super Admin` \| `HR Manager` \| `Employee`      | —            |
| `status`   | `Active` \| `Inactive`                          | —            |
| `sortBy`   | `joiningDate` \| `name`                         | `joiningDate`|
| `order`    | `asc` \| `desc`                                 | `desc`       |

Response:
```json
{
  "data": [ { "...": "employee" } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### GET /api/employees/:id
Returns a single employee (with `reportingManager` populated).

### GET /api/employees/:id/reportees
Returns the direct reports of the given employee ID.

### POST /api/employees
Requires `Super Admin` or `HR Manager`. HR Managers may not set `role: "Super Admin"`.

Body fields: `employeeId, name, email, phone, password, department, designation, salary,
joiningDate, status, role, reportingManager, profileImage`.

### PUT /api/employees/:id
- **Employee** role: may only update their own record, and only `phone` / `profileImage`.
  Any other field in the body is silently ignored.
- **HR Manager**: may update any non-Super-Admin employee; cannot set `role: "Super Admin"`
  or edit an existing Super Admin account.
- **Super Admin**: unrestricted.

### DELETE /api/employees/:id
Requires `Super Admin`. Soft-deletes (sets `isDeleted: true`, `status: "Inactive"`) rather
than removing the record, and reassigns the deleted employee's direct reports to their
former manager.

### PATCH /api/employees/:id/manager
Body: `{ "managerId": "<employeeId or null>" }`

Requires `Super Admin` or `HR Manager`. Rejects the change with `400` if:
- `managerId` equals the employee's own ID, or
- assigning that manager would create a circular reporting chain (checked by walking the
  candidate manager's own chain of managers up to the root).

### POST /api/employees/import
`multipart/form-data` with a `file` field containing a CSV. Requires `Super Admin` or
`HR Manager`.

Expected CSV columns:
```
employeeId,name,email,phone,password,department,designation,salary,joiningDate,status,role
```
Response includes a per-row success/failure breakdown so partial imports are visible.

---

## Organization

### GET /api/organization/tree
Returns the full organization as a nested tree (each node has a `children` array), rooted
at employees with no reporting manager.

---

## Dashboard

### GET /api/dashboard/stats
```json
{
  "data": {
    "totalEmployees": 42,
    "activeEmployees": 38,
    "inactiveEmployees": 4,
    "departmentCount": 5,
    "departmentBreakdown": [{ "department": "Engineering", "count": 20 }]
  }
}
```

---

## Error format

All error responses follow:
```json
{ "message": "Human-readable description", "errors": [ /* optional express-validator details */ ] }
```
