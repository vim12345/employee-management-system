process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');
const Employee = require('../src/models/Employee');

let mongod;
let app;
let adminToken;
let employeeToken;
let employeeRecordId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();

  await Employee.create({
    employeeId: 'EMP-0001',
    name: 'Admin User',
    email: 'admin@test.com',
    phone: '1234567890',
    password: 'Admin@123',
    department: 'Admin',
    designation: 'Super Admin',
    salary: 1000,
    joiningDate: new Date(),
    role: 'Super Admin',
  });

  const empDoc = await Employee.create({
    employeeId: 'EMP-0002',
    name: 'Jane Employee',
    email: 'jane@test.com',
    phone: '1234567891',
    password: 'Jane@123',
    department: 'Engineering',
    designation: 'Developer',
    salary: 5000,
    joiningDate: new Date(),
    role: 'Employee',
  });
  employeeRecordId = empDoc._id.toString();

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'Admin@123',
  });
  adminToken = adminLogin.body.token;

  const empLogin = await request(app).post('/api/auth/login').send({
    email: 'jane@test.com',
    password: 'Jane@123',
  });
  employeeToken = empLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Employee CRUD & RBAC', () => {
  it('allows Super Admin to create an employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: 'EMP-0003',
        name: 'New Hire',
        email: 'newhire@test.com',
        phone: '1234567892',
        password: 'NewHire@123',
        department: 'Sales',
        designation: 'Sales Rep',
        salary: 3000,
        joiningDate: '2024-01-01',
        role: 'Employee',
      });
    expect(res.status).toBe(201);
  });

  it('blocks an Employee role from creating a new employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        employeeId: 'EMP-0004',
        name: 'Blocked Hire',
        email: 'blocked@test.com',
        phone: '1234567893',
        password: 'Blocked@123',
        department: 'Sales',
        designation: 'Sales Rep',
        salary: 3000,
        joiningDate: '2024-01-01',
      });
    expect(res.status).toBe(403);
  });

  it('prevents an Employee from editing fields outside their allowed self-profile fields', async () => {
    const res = await request(app)
      .put(`/api/employees/${employeeRecordId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ salary: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.data.salary).toBe(5000); // salary unchanged, disallowed field silently ignored
  });

  it('allows an Employee to update their own allowed field (phone)', async () => {
    const res = await request(app)
      .put(`/api/employees/${employeeRecordId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ phone: '9998887777' });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('9998887777');
  });

  it('blocks non-Super-Admin from deleting employees', async () => {
    const res = await request(app)
      .delete(`/api/employees/${employeeRecordId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('allows Super Admin to soft-delete an employee', async () => {
    const res = await request(app)
      .delete(`/api/employees/${employeeRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const stillExists = await Employee.findById(employeeRecordId).select('+isDeleted');
    expect(stillExists).not.toBeNull();
    expect(stillExists.isDeleted).toBe(true);
  });

  it('paginates the employee list', async () => {
    const res = await request(app)
      .get('/api/employees?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.limit).toBe(1);
  });
});
