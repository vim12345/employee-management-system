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
let managerA;
let managerB;

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

  managerA = await Employee.create({
    employeeId: 'EMP-A',
    name: 'Manager A',
    email: 'a@test.com',
    phone: '1112223333',
    password: 'Pass@123',
    department: 'Eng',
    designation: 'Manager',
    salary: 8000,
    joiningDate: new Date(),
    role: 'HR Manager',
  });

  managerB = await Employee.create({
    employeeId: 'EMP-B',
    name: 'Manager B',
    email: 'b@test.com',
    phone: '4445556666',
    password: 'Pass@123',
    department: 'Eng',
    designation: 'Manager',
    salary: 8000,
    joiningDate: new Date(),
    role: 'HR Manager',
  });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'Admin@123',
  });
  adminToken = adminLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Organizational hierarchy', () => {
  it('assigns B to report to A', async () => {
    const res = await request(app)
      .patch(`/api/employees/${managerB._id}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ managerId: managerA._id.toString() });
    expect(res.status).toBe(200);
  });

  it('prevents a circular reporting structure (A reporting to B, when B reports to A)', async () => {
    const res = await request(app)
      .patch(`/api/employees/${managerA._id}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ managerId: managerB._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/circular/i);
  });

  it('returns the direct reports of a manager', async () => {
    const res = await request(app)
      .get(`/api/employees/${managerA._id}/reportees`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].employeeId).toBe('EMP-B');
  });

  it('returns the organization tree', async () => {
    const res = await request(app).get('/api/organization/tree').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
