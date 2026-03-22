const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getAllUsers, getUserById, updateUser, changePassword,
  deleteUser, getVisitedStores, recordStoreVisit,
  browseStores, browseDeals, browseEvents,
} = require('../controllers/userController');

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: membership_level
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin role required
 */
router.get('/', authenticateToken, requireAdmin, getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the user
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticateToken, requireSelfOrAdmin, getUserById);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update user profile (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Updated"
 *               phone:
 *                 type: string
 *                 example: "0771234567"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:id', [
  authenticateToken, requireSelfOrAdmin,
  body('name').optional().trim().isLength({ min: 2 }),
  validate,
], updateUser);

/**
 * @openapi
 * /api/users/{id}/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: "TestPass1"
 *               new_password:
 *                 type: string
 *                 example: "NewPass2"
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password incorrect
 */
router.put('/:id/password', [
  authenticateToken, requireSelfOrAdmin,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  validate,
], changePassword);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate user account (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/:id', authenticateToken, requireSelfOrAdmin, deleteUser);

/**
 * @openapi
 * /api/users/{id}/visited-stores:
 *   get:
 *     summary: Get store visit history for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: List of store visits
 */
router.get('/:id/visited-stores', authenticateToken, requireSelfOrAdmin, getVisitedStores);

/**
 * @openapi
 * /api/users/{id}/visit-store:
 *   post:
 *     summary: Record a store visit for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [store_id]
 *             properties:
 *               store_id:
 *                 type: string
 *                 example: "64f3a2b1c9d4e5f6a7b8c9d1"
 *               store_name:
 *                 type: string
 *                 example: "Nike Store"
 *     responses:
 *       201:
 *         description: Visit recorded
 */
router.post('/:id/visit-store', [
  authenticateToken, requireSelfOrAdmin,
  body('store_id').notEmpty(),
  validate,
], recordStoreVisit);

/**
 * @openapi
 * /api/users/{id}/browse-stores:
 *   get:
 *     summary: Browse all mall stores (live from Mall API Service)
 *     tags: [Users - Mall Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Fashion, Electronics, Food & Beverage, Entertainment, Health & Beauty, Sports, Books, Toys, Other]
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         example: "1"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Stores from Mall API Service
 *       503:
 *         description: Mall API Service unavailable
 */
router.get('/:id/browse-stores', authenticateToken, browseStores);

/**
 * @openapi
 * /api/users/{id}/browse-deals:
 *   get:
 *     summary: Browse active deals (live from Mall API Service)
 *     tags: [Users - Mall Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Active deals from Mall API Service
 */
router.get('/:id/browse-deals', authenticateToken, browseDeals);

/**
 * @openapi
 * /api/users/{id}/browse-events:
 *   get:
 *     summary: Browse upcoming events (live from Mall API Service)
 *     tags: [Users - Mall Browsing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Upcoming events from Mall API Service
 */
router.get('/:id/browse-events', authenticateToken, browseEvents);

module.exports = router;