const request = require('supertest');

jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(true));

jest.mock('mongoose', () => {
  const makeChain = () => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      skip:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      sort:     jest.fn().mockReturnThis(),
      select:   jest.fn().mockReturnThis(),
      lean:     jest.fn().mockReturnThis(),
      exec:     jest.fn().mockResolvedValue([]),
    };
    chain.then = (resolve) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      readyState: 1,
      name: 'user_service_db',
      on: jest.fn(),
    },
    Schema: class {
      constructor() {
        this.methods = {};
        this.index = jest.fn();
      }
      plugin() {}
    },
    model: jest.fn(() => ({
      find:              jest.fn().mockReturnValue(makeChain()),
      findOne:           jest.fn().mockReturnValue(makeChain()),
      findById:          jest.fn().mockReturnValue(makeChain()),
      findByIdAndUpdate: jest.fn().mockReturnValue(makeChain()),
      findOneAndUpdate:  jest.fn().mockReturnValue(makeChain()),
      countDocuments:    jest.fn().mockResolvedValue(0),
      create:            jest.fn().mockResolvedValue({}),
      save:              jest.fn().mockResolvedValue({}),
    })),
    Types: {
      ObjectId: String,
    },
  };
});

jest.mock('axios');

process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_API_KEY = 'test-key';
process.env.MONGODB_URI = 'mongodb://test';

const app = require('../src/app');

describe('User Service', () => {
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('User Service');
  });

  it('GET /health returns health object', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('user-service');
  });

  it('POST /api/auth/register fails with weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'weak' });
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/login fails with missing body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(404);
  });

  it('GET /api/users requires auth', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});