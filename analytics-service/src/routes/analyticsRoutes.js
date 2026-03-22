const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authenticateToken, requireAdminOrOperator, authenticateServiceKey } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  receiveEvent,
  getAllStoreVisits, createStoreVisit, deleteStoreVisit,
  getAllDealClicks, createDealClick, deleteDealClick,
  getAllEventAttendance, createEventAttendance, deleteEventAttendance,
  getPopularStores, getActiveUsers, getEventAttendanceStats,
  getPopularDeals, getDailyFootfall, getSummary,
  getActivityLogs, deleteActivityLog,
} = require('../controllers/analyticsController');

// ─── Internal endpoint (service-to-service) ───────────────────────

/**
 * @openapi
 * /api/internal/events:
 *   post:
 *     summary: Receive analytics event from any service (internal — requires x-api-key)
 *     tags: [Internal]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [event_type]
 *             properties:
 *               event_type:
 *                 type: string
 *                 enum: [user_registered, user_login, store_visit, deal_created, store_created, mall_event_created, event_attendance, deal_click]
 *               user_id:  { type: string }
 *               store_id: { type: string }
 *               deal_id:  { type: string }
 *               event_id: { type: string }
 *     responses:
 *       201:
 *         description: Event logged
 *       401:
 *         description: Invalid API key
 */
router.post('/internal/events', [
  authenticateServiceKey,
  body('event_type').notEmpty(),
  validate,
], receiveEvent);

// ─── Store Visits CRUD ────────────────────────────────────────────

/**
 * @openapi
 * /api/analytics/store-visits:
 *   get:
 *     summary: Get all store visit logs
 *     tags: [Store Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: store_id
 *         schema: { type: string }
 *       - in: query
 *         name: user_id
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 */
router.get('/analytics/store-visits', authenticateToken, requireAdminOrOperator, getAllStoreVisits);

/**
 * @openapi
 * /api/analytics/store-visits:
 *   post:
 *     summary: Manually log a store visit (internal)
 *     tags: [Store Visits]
 *     security:
 *       - apiKeyAuth: []
 */
router.post('/analytics/store-visits', [
  authenticateServiceKey,
  body('store_id').notEmpty(),
  validate,
], createStoreVisit);

/**
 * @openapi
 * /api/analytics/store-visits/{id}:
 *   delete:
 *     summary: Delete a store visit log
 *     tags: [Store Visits]
 *     security:
 *       - bearerAuth: []
 */
/**
 * @openapi
 * /api/analytics/store-visits/{id}:
 *   delete:
 *     summary: Delete a store visit log entry
 *     tags: [Store Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the store visit log
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Visit log deleted
 *       404:
 *         description: Log not found
 */
router.delete('/analytics/store-visits/:id', authenticateToken, requireAdminOrOperator, deleteStoreVisit);

// ─── Deal Clicks CRUD ─────────────────────────────────────────────

/**
 * @openapi
 * /api/analytics/deal-clicks:
 *   get:
 *     summary: Get all deal click logs
 *     tags: [Deal Clicks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/deal-clicks', authenticateToken, requireAdminOrOperator, getAllDealClicks);
router.post('/analytics/deal-clicks', [authenticateServiceKey, body('deal_id').notEmpty(), body('store_id').notEmpty(), validate], createDealClick);
/**
 * @openapi
 * /api/analytics/deal-clicks/{id}:
 *   delete:
 *     summary: Delete a deal click log entry
 *     tags: [Deal Clicks]
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
 *         description: Deal click log deleted
 */
router.delete('/analytics/deal-clicks/:id', authenticateToken, requireAdminOrOperator, deleteDealClick);

// ─── Event Attendance CRUD ────────────────────────────────────────

/**
 * @openapi
 * /api/analytics/event-attendance:
 *   get:
 *     summary: Get all event attendance records
 *     tags: [Event Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/event-attendance', authenticateToken, requireAdminOrOperator, getAllEventAttendance);
router.post('/analytics/event-attendance', [authenticateServiceKey, body('event_id').notEmpty(), validate], createEventAttendance);
/**
 * @openapi
 * /api/analytics/event-attendance/{id}:
 *   delete:
 *     summary: Delete an event attendance record
 *     tags: [Event Attendance]
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
 *         description: Attendance record deleted
 */
router.delete('/analytics/event-attendance/:id', authenticateToken, requireAdminOrOperator, deleteEventAttendance);

// ─── Reports (MongoDB Aggregation) ───────────────────────────────

/**
 * @openapi
 * /api/analytics/popular-stores:
 *   get:
 *     summary: Top stores by visit count (MongoDB aggregation)
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 */
router.get('/analytics/popular-stores', authenticateToken, requireAdminOrOperator, getPopularStores);

/**
 * @openapi
 * /api/analytics/active-users:
 *   get:
 *     summary: Most active users by visit count
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/active-users', authenticateToken, requireAdminOrOperator, getActiveUsers);

/**
 * @openapi
 * /api/analytics/event-attendance-stats:
 *   get:
 *     summary: Top events by attendance
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/event-attendance-stats', authenticateToken, requireAdminOrOperator, getEventAttendanceStats);

/**
 * @openapi
 * /api/analytics/popular-deals:
 *   get:
 *     summary: Most clicked deals
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/popular-deals', authenticateToken, requireAdminOrOperator, getPopularDeals);

/**
 * @openapi
 * /api/analytics/daily-footfall:
 *   get:
 *     summary: Day-by-day visitor counts
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 */
router.get('/analytics/daily-footfall', authenticateToken, requireAdminOrOperator, getDailyFootfall);

/**
 * @openapi
 * /api/analytics/summary:
 *   get:
 *     summary: Dashboard summary — total visits, clicks, attendance
 *     tags: [Analytics Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/summary', authenticateToken, requireAdminOrOperator, getSummary);

// ─── Activity Logs CRUD ───────────────────────────────────────────

/**
 * @openapi
 * /api/analytics/logs:
 *   get:
 *     summary: Get all activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/logs', authenticateToken, requireAdminOrOperator, getActivityLogs);

/**
 * @openapi
 * /api/analytics/logs/{id}:
 *   delete:
 *     summary: Delete an activity log entry
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 */
/**
 * @openapi
 * /api/analytics/logs/{id}:
 *   delete:
 *     summary: Delete an activity log entry
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the log entry
 *         example: "64f3a2b1c9d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: Activity log deleted
 *       404:
 *         description: Log not found
 */
router.delete('/analytics/logs/:id', authenticateToken, requireAdminOrOperator, deleteActivityLog);

module.exports = router;