require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const analyticsRoutes = require('./routes/analyticsRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(rateLimit({ windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, max: parseInt(process.env.RATE_LIMIT_MAX) || 200 }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Analytics Service - Swagger' }));
app.use('/health', healthRoutes);
app.use('/api', analyticsRoutes);
app.get('/', (req, res) => res.json({
  service: 'Analytics Service',
  version: '1.0.0',
  db: 'MongoDB Atlas (analytics_service_db)',
  docs: '/api-docs',
  health: '/health',
  endpoints: {
    internal: '/api/internal/events',
    reports: [
      '/api/analytics/summary',
      '/api/analytics/popular-stores',
      '/api/analytics/active-users',
      '/api/analytics/event-attendance-stats',
      '/api/analytics/popular-deals',
      '/api/analytics/daily-footfall',
    ],
  },
}));
app.use(notFound);
app.use(errorHandler);
module.exports = app;
