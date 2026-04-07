
require('dotenv').config({ path: './backend/.env' });
const oracledb = require('oracledb');
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_URL,
};

async function testFetch() {
  let connection;
  try {
    oracledb.thin = true;
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      'SELECT id, email, password_hash, role FROM users FETCH FIRST 1 ROWS ONLY',
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User keys:', Object.keys(user));
      console.log('PASSWORD_HASH type:', typeof user.PASSWORD_HASH);
      console.log('PASSWORD_HASH constructor:', user.PASSWORD_HASH ? user.PASSWORD_HASH.constructor.name : 'null');
    } else {
      console.log('No users found in database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (connection) await connection.close();
  }
}

testFetch();
