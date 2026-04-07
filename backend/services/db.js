const oracledb = require('oracledb');

// Use thick mode for Native Network Encryption support (requires Oracle Client)
try {
  oracledb.initOracleClient();
} catch (err) {
  console.error('Whoops! Thick mode error:', err);
  process.exit(1);
}

oracledb.fetchAsString = [ oracledb.CLOB ];

let pool = null;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_URL,
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1,
};

/**
 * Initialize the Oracle connection pool
 */
async function initialize() {
  try {
    if (!pool) {
      pool = await oracledb.createPool(dbConfig);
      console.log('✅ Oracle DB pool created (verified thick mode)');
    }
  } catch (err) {
    console.error('❌ Oracle DB pool creation failed:', err.message);
    throw err;
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
