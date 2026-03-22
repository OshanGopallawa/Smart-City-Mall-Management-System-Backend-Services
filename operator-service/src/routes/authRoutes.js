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
 *     summary: Register a new operator account
 *     tags: [Operator Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [store_manager, mall_admin, super_admin] }
 *               store_id: { type: string }
 *               store_name: { type: string }
 *     responses:
 *       201:
 *         description: Operator registered — returns tokens
 */
router.post('/register', [
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Must have uppercase, lowercase and number'),
  body('role').optional().isIn(['store_manager', 'mall_admin', 'super_admin']),
  validate,
], register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Operator login — returns JWT tokens
 *     tags: [Operator Auth]
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
 *                 example: "manager@mall.com"
 *               password:
 *                 type: string
 *                 example: "MgrPass1"
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
 *     summary: Get a new access token using your refresh token
 *     tags: [Operator Auth]
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
 *     summary: Logout — invalidates refresh token
 *     tags: [Operator Auth]
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
 *     summary: Get current logged-in operator profile
 *     tags: [Operator Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operator profile data
 *       401:
 *         description: No token provided
 */
router.get('/me', authenticateToken, getMe);

module.exports = router;