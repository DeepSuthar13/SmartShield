
require('dotenv').config();
const db = require('./services/db');

async function testFetch() {
  try {
    console.log('Testing with db service...');
    const result = await db.execute(
      'SELECT id, email, password_hash, role FROM users FETCH FIRST 1 ROWS ONLY'
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User keys:', Object.keys(user));
      console.log('PASSWORD_HASH type:', typeof user.PASSWORD_HASH);
      console.log('PASSWORD_HASH value:', user.PASSWORD_HASH);
      
      // Test bcrypt if available
      try {
        const bcrypt = require('bcrypt');
        console.log('Testing bcrypt.compare...');
        await bcrypt.compare('test', user.PASSWORD_HASH);
        console.log('bcrypt.compare worked (though result might be false)');
      } catch (bcryptErr) {
        console.log('bcrypt.compare failed:', bcryptErr.message);
      }
    } else {
      console.log('No users found in database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testFetch();
