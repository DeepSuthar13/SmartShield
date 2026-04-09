const oracledb = require('oracledb');

// Set fetchAsString to fetch CLOBs as strings
oracledb.fetchAsString = [ oracledb.CLOB ];

// Initialize Thick Mode globally, once, at startup
try {
  if (process.env.ORACLE_CLIENT_LIB_DIR) {
    oracledb.initOracleClient();
  } else {
    // If you're on Linux, sometimes you need to set LD_LIBRARY_PATH instead
    oracledb.initOracleClient(); 
  }
} catch (err) {
  console.error('Fatal Oracle Client Error:', err);
  process.exit(1);
}

let pool = null;
// Singleton promise — prevents multiple concurrent pool creations (race condition)
let initPromise = null;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_URL,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
};

/**
 * Initialize the Oracle connection pool and perform basic setup.
 * Uses a singleton promise to ensure only one pool is ever created,
 * even when multiple queries fire concurrently at startup.
 */
async function initialize() {
  if (pool) return; // Already initialized — fast path

  if (!initPromise) {
    initPromise = (async () => {
      try {
        pool = await oracledb.createPool(dbConfig);
        console.log('✅ Oracle DB pool created (verified thick mode)');
        await ensureDefenceConfig();
      } catch (err) {
        initPromise = null; // Allow retry on next call if pool creation failed
        console.error('❌ Oracle DB pool creation failed:', err.message);
        throw err;
      }
    })();
  }

  await initPromise;
}

/**
 * Helper to ensure the defence_config table is not empty
 */
async function ensureDefenceConfig() {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute('SELECT COUNT(*) AS count FROM defence_config');
    const count = result.rows[0].COUNT;
    
    if (count === 0) {
      console.log('🛡️  Initialising defence_config with default "block" mode...');
      await connection.execute(
        "INSERT INTO defence_config (modes) VALUES ('block')",
        {},
        { autoCommit: true }
      );
    }
  } catch (err) {
    // Table might not exist yet, which is fine if they haven't run schema.sql
    console.warn('⚠️  Could not initialize defence_config (table may not exist yet):', err.message);
  } finally {
    if (connection) await connection.close();
  }
}

async function execute(sql, binds = {}, options = {}) {
  let connection;
  try {
    await initialize();
    connection = await pool.getConnection(); // Get connection from pool
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return result;
  } catch (err) {
    console.error('❌ DB Execute Error:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close(); // Return connection to pool
      } catch (err) {
        console.error('❌ DB Connection Close Error:', err.message);
      }
    }
  }
}

/**
 * Close the pool gracefully
 */
async function close() {
  try {
    if (pool) {
      await pool.close(0);
      console.log('Oracle DB pool closed');
    }
  } catch (err) {
    console.error('Error closing pool:', err.message);
  }
}

module.exports = { initialize, execute, close };
