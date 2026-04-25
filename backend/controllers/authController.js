const pool = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, username, role) => {
  return jwt.sign({ id, username, role }, process.env.JWT_SECRET || 'zandra_super_secret_key_123', {
    expiresIn: '30d',
  });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM auth_users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (isMatch) {
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        token: generateToken(user.id, user.username, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

const registerStaff = async (req, res) => {
  const { username, password, role } = req.body; 
  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const [existing] = await pool.query('SELECT * FROM auth_users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const validRole = role === 'admin' ? 'admin' : 'employee';
    
    const [result] = await pool.query(
      'INSERT INTO auth_users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, validRole]
    );
    
    res.status(201).json({ 
       message: 'User created successfully',
       user: { id: result.insertId, username, role: validRole }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating user', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, role, created_at FROM auth_users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM auth_users WHERE id = ?', [req.params.id]);
    if(result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
}

module.exports = { login, registerStaff, getUsers, deleteUser };
