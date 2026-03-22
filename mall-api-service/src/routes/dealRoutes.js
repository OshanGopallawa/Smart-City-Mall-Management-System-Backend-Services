const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireOperatorRole, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getAllDeals, getDealById, createDeal, updateDeal, deleteDeal } = require('../controllers/dealController');

/**
 * @openapi
 * /api/deals:
 *   get:
 *     summary: Get all active deals
 *     tags: [Deals]
 *     parameters:
 *       - in: query
 *         name: store_id
 *         schema:
 *           type: string
 *         description: Filter by store MongoDB ObjectId
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *       - in: query
 *         name: discount_type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed, buy_x_get_y, bundle]
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
 *         description: List of active deals
 */
router.get('/', optionalAuth, getAllDeals);

/**
 * @openapi
 * /api/deals/{id}:
 *   get:
 *     summary: Get deal by ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the deal
 *         example: "64f3a2b1c9d4e5f6a7b8c9d2"
 *     responses:
 *       200:
 *         description: Deal details
 *       404:
 *         description: Deal not found
 */
router.get('/:id', optionalAuth, getDealById);

/**
 * @openapi
 * /api/deals:
 *   post:
 *     summary: Create a deal (Operator only)
 *     tags: [Deals]
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
 *                 example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *               title:
 *                 type: string
 *                 example: "50% off all shoes"
 *               description:
 *                 type: string
 *                 example: "Weekend mega sale"
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
 *         description: Deal created
 */
router.post('/', [
  authenticateToken, requireOperatorRole,
  body('store_id').notEmpty(),
  body('title').trim().notEmpty().isLength({ max: 150 }),
  body('description').trim().notEmpty(),
  body('discount_type').isIn(['percentage', 'fixed', 'buy_x_get_y', 'bundle']),
  body('discount_value').isFloat({ min: 0 }),
  body('valid_until').isISO8601().toDate(),
  body('valid_from').optional().isISO8601().toDate(),
  validate,
], createDeal);

/**
 * @openapi
 * /api/deals/{id}:
 *   put:
 *     summary: Update deal (Operator only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               discount_value:
 *                 type: number
 *               valid_until:
 *                 type: string
 *                 format: date-time
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Deal updated
 *       404:
 *         description: Deal not found
 */
router.put('/:id', [
  authenticateToken, requireOperatorRole,
  body('discount_value').optional().isFloat({ min: 0 }),
  body('valid_until').optional().isISO8601().toDate(),
  validate,
], updateDeal);

/**
 * @openapi
 * /api/deals/{id}:
 *   delete:
 *     summary: Deactivate deal (Operator only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d2"
 *     responses:
 *       200:
 *         description: Deal deactivated (soft delete)
 */
router.delete('/:id', authenticateToken, requireOperatorRole, deleteDeal);

module.exports = router;