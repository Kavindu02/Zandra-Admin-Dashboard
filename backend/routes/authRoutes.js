const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  login, 
  registerStaff, 
  getUsers, 
  getEmployees,
  deleteUser, 
  getProfile, 
  updateProfile, 
  uploadFiles 
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cv') {
      cb(null, 'public/CV');
    } else {
      cb(null, 'public/Agreements');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.username}_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

router.post('/login', login);
router.post('/register', protect, adminOnly, registerStaff);
router.get('/users', protect, adminOnly, getUsers);
router.get('/employees', protect, getEmployees);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/:id', protect, adminOnly, updateProfile); // Admin can update employee profile

// File upload route
router.post('/upload-files', protect, upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'agreement1', maxCount: 1 },
  { name: 'agreement2', maxCount: 1 }
]), uploadFiles);

module.exports = router;
