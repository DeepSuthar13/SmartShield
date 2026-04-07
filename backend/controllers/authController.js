const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/db');

/**
 * POST /api/auth/login
 * Validate email + password, return JWT with role
 * OTP is skipped — direct JWT on successful login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await db.execute(
      'SELECT id, email, password_hash, role FROM users WHERE email = :email',
      { email }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password with bcrypt hash
    const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Determine role — ADMIN_EMAIL env gets admin role
    const role = (email === process.env.ADMIN_EMAIL) ? 'admin' : user.ROLE;

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.ID,
        email: user.EMAIL,
        role: role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.ID,
        email: user.EMAIL,
        role: role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/register
 * Register a new user (for setup convenience)
 */
async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = await db.execute(
      'SELECT id FROM users WHERE email = :email',
      { email }
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Determine role
    const role = (email === process.env.ADMIN_EMAIL) ? 'admin' : 'user';

    // Insert user
    await db.execute(
      `INSERT INTO users (email, password_hash, role) VALUES (:email, :password_hash, :role)`,
      { email, password_hash: passwordHash, role }
    );

    return res.status(201).json({ message: 'User registered successfully', role });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { login, register };
