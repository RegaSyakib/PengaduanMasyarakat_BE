const pool = require('../config/db');

// --- LIKES ---

const toggleLike = async (req, res) => {
    try {
        const { id } = req.params; // complaint_id
        const userId = req.user.id;

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT user_id, status FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        const complaint = complaints[0];
        if (complaint.status !== 'done' && complaint.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Check if user already liked it
        const [existingLikes] = await pool.query('SELECT id FROM likes WHERE user_id = ? AND complaint_id = ?', [userId, id]);

        if (existingLikes.length > 0) {
            // Unlike
            await pool.query('DELETE FROM likes WHERE user_id = ? AND complaint_id = ?', [userId, id]);
            return res.json({ message: 'Unliked successfully', liked: false });
        } else {
            // Like
            await pool.query('INSERT INTO likes (user_id, complaint_id) VALUES (?, ?)', [userId, id]);
            return res.status(201).json({ message: 'Liked successfully', liked: true });
        }
    } catch (error) {
        console.error('toggleLike error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- COMMENTS ---

const addComment = async (req, res) => {
    try {
        const { id } = req.params; // complaint_id
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT user_id, status FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        const complaint = complaints[0];
        if (complaint.status !== 'done' && complaint.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO comments (user_id, complaint_id, comment) VALUES (?, ?, ?)',
            [userId, id, comment]
        );

        res.status(201).json({ message: 'Comment added successfully', commentId: result.insertId });
    } catch (error) {
        console.error('addComment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getComments = async (req, res) => {
    try {
        const { id } = req.params; // complaint_id
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT user_id, status FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        const complaint = complaints[0];
        if (complaint.status !== 'done' && complaint.user_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const [comments] = await pool.query(
            `SELECT c.*, u.name as user_name, u.role as user_role, u.profile_image as user_profile_image 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.complaint_id = ? 
             ORDER BY c.created_at ASC`,
            [id]
        );

        res.json(comments);
    } catch (error) {
        console.error('getComments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { toggleLike, addComment, getComments };
