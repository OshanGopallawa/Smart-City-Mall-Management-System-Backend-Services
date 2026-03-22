const swaggerJsdoc = require('swagger-jsdoc');
module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Operator Service API', version: '1.0.0', description: 'Smart City Mall - Operator Service (MongoDB Atlas)' },
    servers: [{ url: 'http://localhost:3002' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key' } } },
  },
  apis: ['./src/routes/*.js'],
});
