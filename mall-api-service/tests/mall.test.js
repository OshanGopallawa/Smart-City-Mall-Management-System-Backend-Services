const request = require('supertest');

jest.mock('../src/config/database', () => jest.fn().mockResolvedValue(true));

jest.mock('mongoose', () => {
  const Schema = class {
    constructor() {
      this.methods = {};
      this.index = jest.fn();
    }
  };

  Schema.Types = {
    ObjectId: String,
  };

  // ✅ Build a chainable mock that supports .populate() at every level
  const makeChain = () => {
    const chain = {
      populate: jest.fn().mockReturnThis(),
      skip:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      sort:     jest.fn().mockReturnThis(),
      select:   jest.fn().mockReturnThis(),
      lean:     jest.fn().mockReturnThis(),
      exec:     jest.fn().mockResolvedValue([]),
      then:     undefined, // ✅ makes the chain itself awaitable as []
    };
    // ✅ make the chain thenable so `await Model.find(...)` resolves to []
    chain.then = (resolve) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      readyState: 1,
      name: 'mall_api_db',
      on: jest.fn(),
    },
    Schema,
    model: jest.fn(() => ({
      find:            jest.fn().mockReturnValue(makeChain()),
      findById:        jest.fn().mockReturnValue(makeChain()),
      findByIdAndUpdate: jest.fn().mockReturnValue(makeChain()),
      findOneAndUpdate:  jest.fn().mockReturnValue(makeChain()),
      countDocuments:  jest.fn().mockResolvedValue(0),
      create:          jest.fn().mockResolvedValue({}),
      save:            jest.fn().mockResolvedValue({}),
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

describe('Mall API Service', () => {
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('Mall API Service');
  });

  it('GET /health returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.body.service).toBe('mall-api-service');
  });

  it('GET /api/stores returns 200', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(200);
  });

  it('GET /api/deals returns 200', async () => {
    const res = await request(app).get('/api/deals');
    expect(res.status).toBe(200);
  });

  it('GET /api/events returns 200', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
  });

  it('POST /api/stores requires auth', async () => {
    const res = await request(app)
      .post('/api/stores')
      .send({ name: 'Test', category: 'Fashion', floor: '1', unit_number: 'A-1' });
    expect(res.status).toBe(401);
  });
});