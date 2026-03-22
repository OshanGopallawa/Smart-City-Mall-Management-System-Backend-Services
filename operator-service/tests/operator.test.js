const request = require('supertest');
jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(true));
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 1, name: 'operator_service_db', on: jest.fn() },
  Schema: class { constructor() { this.methods = {}; this.index = jest.fn(); } },
  model: jest.fn(() => ({ findOne: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), create: jest.fn() })),
  Types: { ObjectId: String },
}));
jest.mock('axios');
process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_KEY = 'test-key';
process.env.MONGODB_URI = 'mongodb://test';

const app = require('../src/app');

describe('Operator Service', () => {
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('Operator Service');
  });
  it('GET /health returns health object', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('operator-service');
  });
  it('POST /api/auth/register fails with weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Manager', email: 'mgr@test.com', password: 'weak' });
    expect(res.status).toBe(400);
  });
  it('POST /api/auth/login fails with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
  it('GET /api/operators requires auth', async () => {
    const res = await request(app).get('/api/operators');
    expect(res.status).toBe(401);
  });
});
