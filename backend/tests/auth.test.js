process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');
const Employee = require('../src/models/Employee');

let mongod;
let app;

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
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Auth', () => {
  it('rejects invalid login credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'Admin@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });
});
