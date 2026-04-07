const db = require('../services/db');
const trafficStore = require('../services/trafficStore');

/**
 * GET /api/dashboard/stats
 * Returns: status, traffic count, attack count, blocked IP count
 */
async function getStats(req, res) {
  try {
    // Get attack count
    const attackResult = await db.execute(
      'SELECT COUNT(*) AS attack_count FROM attack_logs'
    );
    const attackCount = attackResult.rows[0]?.ATTACK_COUNT || 0;

    // Get blocked IP count (active only)
    const blockedResult = await db.execute(
      `SELECT COUNT(*) AS blocked_count FROM ip_actions WHERE status = 'active'`
    );
    const blockedCount = blockedResult.rows[0]?.BLOCKED_COUNT || 0;

    // Get in-memory stats
    const memStats = trafficStore.getStats();

    return res.json({
      status: memStats.status || 'normal',
      totalRequests: memStats.totalRequests || 0,
      attackCount: Number(attackCount),
      blockedCount: Number(blockedCount),
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

/**
 * GET /api/dashboard/alerts
 * Returns: Last 10 alerts
 */
async function getAlerts(req, res) {
  try {
    const result = await db.execute(
      `SELECT id, message, created_at 
       FROM alerts 
       ORDER BY created_at DESC 
       FETCH FIRST 10 ROWS ONLY`
    );

    return res.json({ alerts: result.rows || [] });
  } catch (err) {
    console.error('Alerts error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

/**
 * GET /api/dashboard/blocked-ips
 * Returns: Last 5 blocked/actioned IPs
 */
async function getBlockedIPs(req, res) {
  try {
    const result = await db.execute(
      `SELECT id, ip_address, action, status, created_at 
       FROM ip_actions 
       WHERE status = 'active'
       ORDER BY created_at DESC 
       FETCH FIRST 5 ROWS ONLY`
    );

    return res.json({ blockedIPs: result.rows || [] });
  } catch (err) {
    console.error('Blocked IPs error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch blocked IPs' });
  }
}

/**
 * GET /api/dashboard/traffic
 * Returns: In-memory traffic data (NOT from DB)
 */
async function getTraffic(req, res) {
  try {
    const data = trafficStore.getTrafficData();
    return res.json({ traffic: data });
  } catch (err) {
    console.error('Traffic error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch traffic' });
  }
}

/**
 * POST /api/dashboard/set-defence
 * Admin only — Update defence mode
 * Input: { "mode": "block" | "rate_limit" | "captcha" }
 */
async function setDefence(req, res) {
  try {
    const { mode } = req.body;

    if (!mode || !['block', 'rate_limit', 'captcha'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Must be: block, rate_limit, or captcha',
      });
    }

    // Try to update the first row
    const result = await db.execute(
      `UPDATE defence_config SET modes = :newMode, updated_at = CURRENT_TIMESTAMP WHERE ROWNUM = 1`,
      { newMode: mode }
    );

    // If no row was updated (table empty), insert the first row
    if (result.rowsAffected === 0) {
      await db.execute(
        `INSERT INTO defence_config (modes) VALUES (:newMode)`,
        { newMode: mode }
      );
    }

    return res.json({ message: `Defence mode successfully updated to: ${mode}`, mode });
  } catch (err) {
    console.error('Set defence error:', err.message);
    return res.status(500).json({ error: `Failed to update defence mode: ${err.message}` });
  }
}

/**
 * POST /api/dashboard/push-traffic
 * Internal API for detection engine to push traffic data
 * Called by the Python engine to update in-memory stats
 */
async function pushTraffic(req, res) {
  try {
    const { requestCount, attackCount, status } = req.body;

    trafficStore.pushTrafficPoint({
      timestamp: new Date().toISOString(),
      requestCount: requestCount || 0,
      attackCount: attackCount || 0,
    });

    if (status) {
      trafficStore.updateStats({ status });
    }
    if (requestCount) {
      trafficStore.updateStats({
        totalRequests: trafficStore.getStats().totalRequests + requestCount,
      });
    }
    if (attackCount) {
      trafficStore.updateStats({
        totalAttacks: trafficStore.getStats().totalAttacks + attackCount,
      });
    }

    return res.json({ message: 'Traffic data pushed' });
  } catch (err) {
    console.error('Push traffic error:', err.message);
    return res.status(500).json({ error: 'Failed to push traffic data' });
  }
}

module.exports = {
  getStats,
  getAlerts,
  getBlockedIPs,
  getTraffic,
  setDefence,
  pushTraffic,
};
