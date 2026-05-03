const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
    const uploadPath = file.fieldname === 'cv' 
      ? path.join(__dirname, '../public/CV') 
      : path.join(__dirname, '../public/Agreements');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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

// Secure file download route
router.get('/download-file', protect, (req, res) => {
  const relativePath = req.query.path;
  if (!relativePath) {
    return res.status(400).json({ message: 'File path is required' });
  }

  // Normalize and resolve path
  // If the path in DB is 'public/CV/file.pdf' or 'public\CV\file.pdf'
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Construct absolute path. 
  let finalPath;
  if (path.isAbsolute(normalizedPath)) {
    finalPath = normalizedPath;
  } else if (normalizedPath.startsWith('public/')) {
    finalPath = path.join(__dirname, '..', normalizedPath);
  } else {
    finalPath = path.join(__dirname, '../public', normalizedPath);
  }

  if (!fs.existsSync(finalPath)) {
    console.error('File not found:', finalPath);
    return res.status(404).json({ message: 'File not found on server' });
  }

  // Security check: ensure the path is inside the public folder
  const publicDir = path.resolve(__dirname, '../public');
  if (!path.resolve(finalPath).startsWith(publicDir)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.download(finalPath);
});

module.exports = router;
