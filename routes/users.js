const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser, updateProfile, updateUserRole } = require('../controllers/userController');
const { verifyToken, verifyAdmin, verifySuperAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Both admin and super_admin can access these routes (verifyAdmin allows both now)
router.get('/', verifyToken, verifyAdmin, getUsers);
router.post('/', verifyToken, verifySuperAdmin, createUser);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/profile', verifyToken, (req, res, next) => {
    upload.single('profile_image')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' 
                ? 'Ukuran foto terlalu besar. Maksimal adalah 10MB!' 
                : (err.message || 'Gagal mengunggah foto.');
            return res.status(400).json({ message });
        }
        next();
    });
}, updateProfile);
router.put('/:id/role', verifyToken, verifyAdmin, updateUserRole);

module.exports = router;
