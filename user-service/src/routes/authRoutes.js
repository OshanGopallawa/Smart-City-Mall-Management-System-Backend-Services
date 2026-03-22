const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { register, login, refreshToken, logout, getMe } = require('../controllers/authController');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new shopper account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "TestPass1"
 *                 description: Must have uppercase, lowercase and a number
 *               phone:
 *                 type: string
 *                 example: "0771234567"
 *     responses:
 *       201:
 *         description: Registration successful — returns access_token and refresh_token
 *       409:
 *         description: Email already registered
 */
router.post('/register', [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Must have uppercase, lowercase, and number'),
  body('phone').optional().isMobilePhone(),
  validate,
], register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "TestPass1"
 *     responses:
 *       200:
 *         description: Login successful — returns access_token and refresh_token
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Get new access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: New access_token and refresh_token issued
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', [body('refresh_token').notEmpty(), validate], refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout — invalidates your refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: No token provided
 */
router.post('/logout', authenticateToken, logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get currently logged-in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your user profile data
 *       401:
 *         description: No token provided
 */
router.get('/me', authenticateToken, getMe);

module.exports = router;