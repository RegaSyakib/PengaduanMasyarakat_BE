const express = require('express');
const router = express.Router();
const { 
    createComplaint, 
    getComplaints, 
    getComplaintById, 
    updateComplaintStatus, 
    deleteComplaint, 
    getUserNotifications,
    markNotificationAsRead,
    updateComplaint
} = require('../controllers/complaintController');
const { toggleLike, addComment, getComments } = require('../controllers/interactionController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', verifyToken, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            // Jika ada error Multer (seperti file too large), kirim response JSON yang rapi
            const message = err.code === 'LIMIT_FILE_SIZE' 
                ? 'Ukuran foto terlalu besar. Maksimal adalah 10MB!' 
                : (err.message || 'Gagal mengunggah foto.');
            return res.status(400).json({ message });
        }
        next();
    });
}, createComplaint);
router.get('/', verifyToken, getComplaints);
router.get('/notifications', verifyToken, getUserNotifications);
router.put('/notifications/:id/read', verifyToken, markNotificationAsRead);
router.get('/:id', verifyToken, getComplaintById);
router.put('/:id', verifyToken, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' 
                ? 'Ukuran foto terlalu besar. Maksimal adalah 10MB!' 
                : (err.message || 'Gagal mengunggah foto.');
            return res.status(400).json({ message });
        }
        next();
    });
}, updateComplaint);
router.put('/:id/status', verifyToken, verifyAdmin, updateComplaintStatus);
router.delete('/:id', verifyToken, deleteComplaint);

// Interaction Routes
router.post('/:id/like', verifyToken, toggleLike);
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);

module.exports = router;
