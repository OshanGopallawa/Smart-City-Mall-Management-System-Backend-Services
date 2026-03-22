const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireOperatorRole, optionalAuth, authenticateServiceKey } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, recordAttendance } = require('../controllers/eventController');

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Get all upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [sale, entertainment, exhibition, food_festival, kids_event, seasonal, other]
 *       - in: query
 *         name: upcoming_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only return events that have not ended yet
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
 *         description: List of events
 */
router.get('/', optionalAuth, getAllEvents);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the event
 *         example: "64f3a2b1c9d4e5f6a7b8c9d3"
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', optionalAuth, getEventById);

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create an event (Operator only)
 *     tags: [Events]
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
 *               ticket_price:
 *                 type: number
 *                 example: 0
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/', [
  authenticateToken, requireOperatorRole,
  body('name').trim().notEmpty().isLength({ max: 150 }),
  body('description').trim().notEmpty(),
  body('event_type').isIn(['sale', 'entertainment', 'exhibition', 'food_festival', 'kids_event', 'seasonal', 'other']),
  body('location_in_mall').trim().notEmpty(),
  body('start_time').isISO8601().toDate(),
  body('end_time').isISO8601().toDate(),
  body('max_capacity').optional().isInt({ min: 0 }),
  body('ticket_price').optional().isFloat({ min: 0 }),
  validate,
], createEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   put:
 *     summary: Update event (Operator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d3"
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
 *               location_in_mall:
 *                 type: string
 *               max_capacity:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated
 *       404:
 *         description: Event not found
 */
router.put('/:id', [
  authenticateToken, requireOperatorRole,
  body('start_time').optional().isISO8601().toDate(),
  body('end_time').optional().isISO8601().toDate(),
  validate,
], updateEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Cancel event (Operator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "64f3a2b1c9d4e5f6a7b8c9d3"
 *     responses:
 *       200:
 *         description: Event cancelled (soft delete)
 */
router.delete('/:id', authenticateToken, requireOperatorRole, deleteEvent);

/**
 * @openapi
 * /api/events/{id}/attend:
 *   post:
 *     summary: Record event attendance (internal service call only)
 *     tags: [Events]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the event
 *         example: "64f3a2b1c9d4e5f6a7b8c9d3"
 *     responses:
 *       200:
 *         description: Attendance recorded
 *       409:
 *         description: Event at full capacity
 */
router.post('/:id/attend', authenticateServiceKey, recordAttendance);

module.exports = router;