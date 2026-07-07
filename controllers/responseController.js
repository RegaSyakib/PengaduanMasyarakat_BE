const pool = require('../config/db');

const addResponse = async (req, res) => {
    try {
        const { complaint_id, message } = req.body;
        const admin_id = req.user.id;

        if (!complaint_id || !message) {
            return res.status(400).json({ message: 'Complaint ID and message are required' });
        }

        // Check if complaint exists
        const [complaints] = await pool.query('SELECT * FROM complaints WHERE id = ?', [complaint_id]);
        if (complaints.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        const complaint = complaints[0];

        // Insert into comments instead of responses
        await pool.query(
            'INSERT INTO comments (user_id, complaint_id, comment) VALUES (?, ?, ?)',
            [admin_id, complaint_id, message]
        );

        // Send notification to complaint owner when admin responds
        const notifMessage = `Tanggapan baru dari Admin untuk "${complaint.title}": "${message.length > 60 ? message.substring(0, 60) + '...' : message}"`;
        await pool.query(
            'INSERT INTO notifications (user_id, complaint_id, admin_id, message) VALUES (?, ?, ?, ?)',
            [complaint.user_id, complaint_id, admin_id, notifMessage]
        );

        res.status(201).json({ message: 'Response added successfully' });
    } catch (error) {
        console.error('addResponse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteResponse = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete from comments table instead of responses table
        const [result] = await pool.query('DELETE FROM comments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.json({ message: 'Response deleted successfully' });
    } catch (error) {
        console.error('deleteResponse error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addResponse, deleteResponse };
