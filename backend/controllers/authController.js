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
    const [users] = await pool.query('SELECT id, username, role, phone, email, cv_path, agreement1_path, agreement2_path, created_at FROM auth_users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, phone, email, cv_path, agreement1_path, agreement2_path FROM auth_users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { phone, email } = req.body;
  const userId = req.params.id || req.user.id; // Admin can specify id, employee uses their own
  
  try {
    await pool.query(
      'UPDATE auth_users SET phone = ?, email = ? WHERE id = ?',
      [phone, email, userId]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

const uploadFiles = async (req, res) => {
  const userId = req.user.id;
  const files = req.files;
  const path = require('path');
  
  try {
    let updateFields = [];
    let values = [];
    const backendRoot = path.join(__dirname, '..');
    
    if (files.cv) {
      updateFields.push('cv_path = ?');
      // Convert to relative path and use forward slashes for DB consistency
      const relPath = path.relative(backendRoot, files.cv[0].path).replace(/\\/g, '/');
      values.push(relPath);
    }
    if (files.agreement1) {
      updateFields.push('agreement1_path = ?');
      const relPath = path.relative(backendRoot, files.agreement1[0].path).replace(/\\/g, '/');
      values.push(relPath);
    }
    if (files.agreement2) {
      updateFields.push('agreement2_path = ?');
      const relPath = path.relative(backendRoot, files.agreement2[0].path).replace(/\\/g, '/');
      values.push(relPath);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    values.push(userId);
    await pool.query(
      `UPDATE auth_users SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Files uploaded successfully' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error uploading files', error: error.message });
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

const getEmployees = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username FROM auth_users WHERE role = ?', ['employee']);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching employees', error: error.message });
  }
};

module.exports = { login, registerStaff, getUsers, getEmployees, deleteUser, getProfile, updateProfile, uploadFiles };
