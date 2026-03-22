const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireOperatorRole, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getAllStores, getStoreById, createStore, updateStore, deleteStore, getStoreDeals } = require('../controllers/storeController');

/**
 * @openapi
 * /api/stores:
 *   get:
 *     summary: Get all active stores
 *     tags: [Stores]
 *     parameters:
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
 *         description: Search by store name
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
 *         description: List of stores
 */
router.get('/', optionalAuth, getAllStores);

/**
 * @openapi
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID — includes active deals
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the store
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Store details with embedded deals
 *       404:
 *         description: Store not found
 */
router.get('/:id', optionalAuth, getStoreById);

/**
 * @openapi
 * /api/stores:
 *   post:
 *     summary: Create a new store (Operator only)
 *     tags: [Stores]
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
 *               contact_phone:
 *                 type: string
 *                 example: "0112345678"
 *               contact_email:
 *                 type: string
 *                 example: "nike@mall.com"
 *     responses:
 *       201:
 *         description: Store created
 *       401:
 *         description: Token required
 */
router.post('/', [
  authenticateToken, requireOperatorRole,
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('category').isIn(['Fashion', 'Electronics', 'Food & Beverage', 'Entertainment', 'Health & Beauty', 'Sports', 'Books', 'Toys', 'Other']),
  body('floor').trim().notEmpty(),
  body('unit_number').trim().notEmpty(),
  body('contact_email').optional().isEmail(),
  validate,
], createStore);

/**
 * @openapi
 * /api/stores/{id}:
 *   put:
 *     summary: Update store (Operator only)
 *     tags: [Stores]
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
 *               description:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Store updated
 *       404:
 *         description: Store not found
 */
router.put('/:id', [
  authenticateToken, requireOperatorRole,
  body('contact_email').optional().isEmail(),
  validate,
], updateStore);

/**
 * @openapi
 * /api/stores/{id}:
 *   delete:
 *     summary: Deactivate store (Operator only)
 *     tags: [Stores]
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
 *         description: Store deactivated (soft delete)
 *       404:
 *         description: Store not found
 */
router.delete('/:id', authenticateToken, requireOperatorRole, deleteStore);

/**
 * @openapi
 * /api/stores/{id}/deals:
 *   get:
 *     summary: Get all active deals for a specific store
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the store
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: List of active deals
 *       404:
 *         description: Store not found
 */
router.get('/:id/deals', optionalAuth, getStoreDeals);

module.exports = router;