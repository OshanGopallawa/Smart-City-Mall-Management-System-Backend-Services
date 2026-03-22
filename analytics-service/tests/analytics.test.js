const request = require('supertest');

jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(true));
jest.mock('../src/models/index', () => ({
  ActivityLog: {
    create: jest.fn().mockResolvedValue({ _id: 'log1' }),
    countDocuments: jest.fn().mockResolvedValue(5),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'log1' }),
    aggregate: jest.fn().mockResolvedValue([]),
  },
  StoreVisit: {
    create: jest.fn().mockResolvedValue({ _id: 'sv1' }),
    countDocuments: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'sv1' }),
    aggregate: jest.fn().mockResolvedValue([]),
  },
  DealClick: {
    create: jest.fn().mockResolvedValue({ _id: 'dc1' }),
    countDocuments: jest.fn().mockResolvedValue(3),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }) }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'dc1' }),
    aggregate: jest.fn().mockResolvedValue([]),
  },
  EventAttendance: {
    create: jest.fn().mockResolvedValue({ _id: 'ea1' }),
    countDocuments: jest.fn().mockResolvedValue(2),
    find: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'ea1' }),
    aggregate: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 1, name: 'analytics_service_db', on: jest.fn() },
}));

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_KEY = 'test-key';
process.env.MONGODB_URI = 'mongodb://test';

const app = require('../src/app');

describe('Analytics Service', () => {
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('Analytics Service');
  });

  it('GET /health returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('analytics-service');
  });

  it('POST /api/internal/events rejects wrong API key', async () => {
    const res = await request(app).post('/api/internal/events')
      .set('x-api-key', 'wrong-key')
      .send({ event_type: 'user_login' });
    expect(res.status).toBe(401);
  });

  it('POST /api/internal/events accepts valid API key', async () => {
    const res = await request(app).post('/api/internal/events')
      .set('x-api-key', 'test-key')
      .send({ event_type: 'user_login', user_id: 'abc123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/internal/events fails with missing event_type', async () => {
    const res = await request(app).post('/api/internal/events')
      .set('x-api-key', 'test-key')
      .send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/analytics/summary requires auth', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(401);
  });
});
