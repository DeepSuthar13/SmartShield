const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/alerts
router.get('/alerts', dashboardController.getAlerts);

// GET /api/dashboard/blocked-ips
router.get('/blocked-ips', dashboardController.getBlockedIPs);

// GET /api/dashboard/traffic
router.get('/traffic', dashboardController.getTraffic);

// POST /api/dashboard/set-defence (admin only)
router.post('/set-defence', adminOnly, dashboardController.setDefence);

// POST /api/dashboard/push-traffic (internal — from detection engine)
router.post('/push-traffic', dashboardController.pushTraffic);

module.exports = router;
