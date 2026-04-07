/**
 * In-memory traffic store for real-time dashboard data.
 * DO NOT store real-time traffic in DB — use memory only.
 * 
 * Maintains a rolling window of traffic data points
 * that the frontend polls every 3 seconds.
 */

const MAX_POINTS = 60; // Keep last 60 data points (~3 minutes at 3s intervals)

// Traffic data: array of { timestamp, requestCount, attackCount }
let trafficData = [];

// Current counters (reset periodically by detection engine)
let currentStats = {
  totalRequests: 0,
  totalAttacks: 0,
  status: 'normal', // 'normal' | 'under_attack'
};

/**
 * Push a new traffic data point
 */
function pushTrafficPoint(point) {
  trafficData.push({
    timestamp: point.timestamp || new Date().toISOString(),
    requestCount: point.requestCount || 0,
    attackCount: point.attackCount || 0,
  });

  // Keep rolling window
  if (trafficData.length > MAX_POINTS) {
    trafficData = trafficData.slice(-MAX_POINTS);
  }
}

/**
 * Get all traffic data points
 */
function getTrafficData() {
  return [...trafficData];
}

/**
 * Update current stats
 */
function updateStats(stats) {
  currentStats = { ...currentStats, ...stats };
}

/**
 * Get current stats
 */
function getStats() {
  return { ...currentStats };
}

/**
 * Increment request count
 */
function incrementRequests() {
  currentStats.totalRequests++;
}

/**
 * Increment attack count and set status
 */
function incrementAttacks() {
  currentStats.totalAttacks++;
  currentStats.status = 'under_attack';
}

/**
 * Reset status to normal
 */
function setNormal() {
  currentStats.status = 'normal';
}

module.exports = {
  pushTrafficPoint,
  getTrafficData,
  updateStats,
  getStats,
  incrementRequests,
  incrementAttacks,
  setNormal,
};
