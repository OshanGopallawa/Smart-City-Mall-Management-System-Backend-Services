const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireMallAdmin, requireSelfOrAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getAllOperators, getOperatorById, updateOperator, changePassword,
  deleteOperator, createStore, updateStore, createDeal, createEvent, getMyStore,
} = require('../controllers/operatorController');

/**
 * @openapi
 * /api/operators:
 *   get:
 *     summary: List all operators (Mall Admin only)
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [store_manager, mall_admin, super_admin]
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
 *         description: List of operators
 *       403:
 *         description: Mall Admin role required
 */
router.get('/', authenticateToken, requireMallAdmin, getAllOperators);

/**
 * @openapi
 * /api/operators/{id}:
 *   get:
 *     summary: Get operator by ID (self or admin)
 *     tags: [Operators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the operator
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Operator profile
 *       404:
 *         description: Operator not found
 */
router.get('/:id', authenticateToken, requireSelfOrAdmin, getOperatorById);

/**
 * @openapi
 * /api/operators/{id}:
 *   put:
 *     summary: Update operator details (self or admin)
 *     tags: [Operators]
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
 *                 example: "Updated Manager"
 *               phone:
 *                 type: string
 *                 example: "0771234567"
 *               role:
 *                 type: string
 *                 enum: [store_manager, mall_admin, super_admin]
 *               store_id:
 *                 type: string
 *                 example: "64f3a2b1c9d4e5f6a7b8c9d1"
 *     responses:
 *       200:
 *         description: Operator updated
 */
router.put('/:id', [
  authenticateToken, requireSelfOrAdmin,
  body('name').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['store_manager', 'mall_admin', 'super_admin']),
  validate,
], updateOperator);

/**
 * @openapi
 * /api/operators/{id}/password:
 *   put:
 *     summary: Change operator password
 *     tags: [Operators]
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
 *                 example: "MgrPass1"
 *               new_password:
 *                 type: string
 *                 example: "NewPass2"
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put('/:id/password', [
  authenticateToken, requireSelfOrAdmin,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  validate,
], changePassword);

/**
 * @openapi
 * /api/operators/{id}:
 *   delete:
 *     summary: Deactivate operator account (Mall Admin only)
 *     tags: [Operators]
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
 *         description: Operator deactivated
 */
router.delete('/:id', authenticateToken, requireMallAdmin, deleteOperator);

// ─── Mall API proxy actions ───────────────────────────────────────

/**
 * @openapi
 * /api/operators/actions/stores:
 *   post:
 *     summary: Create a store via Mall API Service
 *     tags: [Operator Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category, floor, unit_number]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nike Store"
 *               category:
 *                 type: string
 *                 enum: [Fashion, Electronics, Food & Beverage, Entertainment, Health & Beauty, Sports, Books, Toys, Other]
 *                 example: "Sports"
 *               floor:
 *                 type: string
 *                 example: "1"
 *               unit_number:
 *                 type: string
 *                 example: "A-101"
 *               description:
 *                 type: string
 *                 example: "World's leading sportswear brand"
 *     responses:
 *       201:
 *         description: Store created via Mall API Service
 *       503:
 *         description: Mall API Service unavailable
 */
router.post('/actions/stores', [
  authenticateToken,
  body('name').trim().notEmpty(),
  body('category').notEmpty(),
  body('floor').notEmpty(),
  body('unit_number').notEmpty(),
  validate,
], createStore);

/**
 * @openapi
 * /api/operators/actions/stores/{storeId}:
 *   put:
 *     summary: Update a store via Mall API Service
 *     tags: [Operator Actions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the store in mall_api_db
 *         example: "64f3a2b1c9d4e5f6a7b8c9d1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store updated via Mall API Service
 */
router.put('/actions/stores/:storeId', authenticateToken, updateStore);

/**
 * @openapi
 * /api/operators/actions/deals:
 *   post:
 *     summary: Create a deal via Mall API Service
 *     tags: [Operator Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [store_id, title, description, discount_type, discount_value, valid_until]
 *             properties:
 *               store_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the store
 *                 example: "64f3a2b1c9d4e5f6a7b8c9d1"
 *               title:
 *                 type: string
 *                 example: "50% off all shoes"
 *               description:
 *                 type: string
 *                 example: "Weekend mega sale on all footwear"
 *               discount_type:
 *                 type: string
 *                 enum: [percentage, fixed, buy_x_get_y, bundle]
 *                 example: "percentage"
 *               discount_value:
 *                 type: number
 *                 example: 50
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-01T00:00:00Z"
 *               original_price:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Deal created via Mall API Service
 */
router.post('/actions/deals', [
  authenticateToken,
  body('store_id').notEmpty(),
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('discount_type').isIn(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
  body('discount_value').isFloat({ min: 0 }),
  body('valid_until').isISO8601(),
  validate,
], createDeal);

/**
 * @openapi
 * /api/operators/actions/events:
 *   post:
 *     summary: Create an event via Mall API Service
 *     tags: [Operator Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, event_type, location_in_mall, start_time, end_time]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Spring Food Festival"
 *               description:
 *                 type: string
 *                 example: "A celebration of Sri Lankan cuisine"
 *               event_type:
 *                 type: string
 *                 enum: [sale, entertainment, exhibition, food_festival, kids_event, seasonal, other]
 *                 example: "food_festival"
 *               location_in_mall:
 *                 type: string
 *                 example: "Main Atrium Level 1"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-10T10:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-10T20:00:00Z"
 *               max_capacity:
 *                 type: integer
 *                 example: 500
 *               is_free:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Event created via Mall API Service
 */
router.post('/actions/events', [
  authenticateToken,
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('event_type').isIn(['sale', 'entertainment', 'exhibition', 'food_festival', 'kids_event', 'seasonal', 'other']),
  body('location_in_mall').trim().notEmpty(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  validate,
], createEvent);

/**
 * @openapi
 * /api/operators/actions/my-store:
 *   get:
 *     summary: Get operator's assigned store from Mall API Service
 *     tags: [Operator Actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store details with active deals
 *       400:
 *         description: No store assigned to this operator
 *       503:
 *         description: Mall API Service unavailable
 */
router.get('/actions/my-store', authenticateToken, getMyStore);

module.exports = router;