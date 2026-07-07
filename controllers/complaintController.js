const pool = require('../config/db');

const createComplaint = async (req, res) => {
    try {
        console.log('createComplaint() called:', {
            userId: req?.user?.id,
            body: req.body,
            file: req?.file ? { originalname: req.file.originalname, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null
        });

        const { title, description, latitude, longitude, category } = req.body;
        const userId = req.user.id;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO complaints (user_id, title, description, image, status, latitude, longitude, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, description, image, 'pending', latitude || null, longitude || null, category || 'Lainnya']
        );

        res.status(201).json({ message: 'Complaint created successfully', complaintId: result.insertId });
    } catch (error) {
        console.error('createComplaint error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getComplaints = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // LaporPak: Return all complaints with like/comment counts and user like status
        // Filter pending complaints if not admin or owner
        let query = `
            SELECT 
                c.*,
                u.name as user_name,
                u.profile_image as user_profile_image,
                (SELECT COUNT(*) FROM likes WHERE complaint_id = c.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE complaint_id = c.id) as comments_count,
                IF(EXISTS(SELECT 1 FROM likes WHERE complaint_id = c.id AND user_id = ?), 1, 0) as is_liked_by_me
            FROM complaints c
            JOIN users u ON c.user_id = u.id
        `;
        const params = [userId];

        if (userRole !== 'admin' && userRole !== 'super_admin') {
            query += ` WHERE c.status = 'done' OR c.user_id = ? `;
            params.push(userId);
        }

        query += ` ORDER BY c.created_at DESC `;

        const [complaints] = await pool.query(query, params);
        
        // Convert integer 1/0 to boolean for is_liked_by_me
        const formattedComplaints = complaints.map(c => ({
            ...c,
            is_liked_by_me: !!c.is_liked_by_me
        }));

        res.json(formattedComplaints);
    } catch (error) {
        console.error('getComplaints() failed:', {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            errno: error?.errno,
            sqlMessage: error?.sqlMessage,
            sqlState: error?.sqlState,
            userId: req?.user?.id
        });
        res.status(500).json({ message: 'Server error' });
    }
};

const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [complaints] = await pool.query(
            'SELECT c.*, u.name as user_name, u.profile_image as user_profile_image FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
            [id]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = complaints[0];

        // Restrict details of unresolved complaints (not done) from other users
        if (complaint.status !== 'done' && complaint.user_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // LaporPak: Everyone can see the complaint details
        // Get responses (queried from comments where user is admin/super_admin)
        const [responses] = await pool.query(
            `SELECT c.id, c.complaint_id, c.user_id as admin_id, c.comment as message, c.created_at, u.name as admin_name 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.complaint_id = ? AND (u.role = 'admin' OR u.role = 'super_admin') 
             ORDER BY c.created_at ASC`,
            [id]
        );

        complaint.responses = responses;
        res.json(complaint);
    } catch (error) {
        console.error('getComplaintById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.id;

        if (!['pending', 'process', 'done', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Fetch complaint details to get owner's user_id and title
        const [complaints] = await pool.query('SELECT user_id, title FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        const complaint = complaints[0];

        const [result] = await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Send notification to complaint owner when status is updated
        let statusLabel = status;
        if (status === 'pending') statusLabel = 'Pending (Ditunda)';
        else if (status === 'process') statusLabel = 'In Progress (Sedang Diproses)';
        else if (status === 'done') statusLabel = 'Resolved (Selesai)';
        else if (status === 'approved') statusLabel = 'Disetujui';
        else if (status === 'rejected') statusLabel = 'Ditolak';

        const notifMessage = `Status laporan Anda "${complaint.title}" telah diubah menjadi: ${statusLabel}`;

        await pool.query(
            'INSERT INTO notifications (user_id, complaint_id, admin_id, message) VALUES (?, ?, ?, ?)',
            [complaint.user_id, id, adminId, notifMessage]
        );

        res.json({ message: 'Complaint status updated and notification sent' });
    } catch (error) {
        console.error('updateComplaintStatus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch complaint to check ownership
        const [complaints] = await pool.query('SELECT user_id FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = complaints[0];
        if (userRole !== 'admin' && userRole !== 'super_admin' && complaint.user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this complaint' });
        }

        await pool.query('DELETE FROM complaints WHERE id = ?', [id]);
        res.json({ message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error('deleteComplaint error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, latitude, longitude, category } = req.body;
        const newImage = req.file ? `/uploads/${req.file.filename}` : null;

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const complaint = complaints[0];
        // Check ownership
        if (complaint.user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized to edit this complaint' });
        }

        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        // Prepare updated fields
        let query = 'UPDATE complaints SET title = ?, description = ?, category = ?';
        const params = [title, description, category || 'Lainnya'];

        if (newImage) {
            query += ', image = ?';
            params.push(newImage);
        }

        if (latitude !== undefined) {
            query += ', latitude = ?';
            params.push(latitude && latitude !== 'null' ? parseFloat(latitude) : null);
        }
        if (longitude !== undefined) {
            query += ', longitude = ?';
            params.push(longitude && longitude !== 'null' ? parseFloat(longitude) : null);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);

        res.json({ message: 'Complaint updated successfully' });
    } catch (error) {
        console.error('updateComplaint error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await pool.query(
            `SELECT n.*, c.title as complaint_title, u.name as admin_name 
             FROM notifications n 
             JOIN complaints c ON n.complaint_id = c.id 
             LEFT JOIN users u ON n.admin_id = u.id
             WHERE n.user_id = ? 
             ORDER BY n.created_at DESC`,
            [userId]
        );
        res.json(notifications);
    } catch (error) {
        console.error('getUserNotifications() failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('markNotificationAsRead() failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    createComplaint, 
    getComplaints, 
    getComplaintById, 
    updateComplaintStatus, 
    deleteComplaint, 
    getUserNotifications,
    markNotificationAsRead,
    updateComplaint
};
