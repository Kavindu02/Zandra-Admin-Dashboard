const express = require('express');
const router = express.Router();
const { login, registerStaff, getUsers, deleteUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', protect, adminOnly, registerStaff);
router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
