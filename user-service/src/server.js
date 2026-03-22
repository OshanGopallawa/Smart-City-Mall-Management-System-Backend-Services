require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`👤 User Service → http://localhost:${PORT}`);
    logger.info(`📚 Swagger     → http://localhost:${PORT}/api-docs`);
    logger.info(`🔗 Database    → MongoDB Atlas (user_service_db)`);
  });
  ['SIGTERM', 'SIGINT'].forEach(sig => process.on(sig, () => {
    logger.info(`${sig} received`);
    server.close(() => process.exit(0));
  }));
};

start().catch(err => { logger.error('Startup failed:', err); process.exit(1); });
