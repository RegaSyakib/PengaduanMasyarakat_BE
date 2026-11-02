const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const getUsers = async (req, res) => {
    try {
        const currentRole = req.user.role;
        const { search } = req.query;

        let query = 'SELECT id, name, email, role, profile_image, created_at FROM users WHERE id != ? ';
        const params = [req.user.id];

        // Admin can only see 'user' role
        if (currentRole === 'admin') {
            query += "AND role = 'user' ";
        }

        if (search && search.trim()) {
            query += "AND (name LIKE ? OR email LIKE ?) ";
            const wildcard = `%${search.trim()}%`;
            params.push(wildcard, wildcard);
        }
        
        query += 'ORDER BY created_at DESC';

        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (error) {
        console.error('getUsers() failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const currentRole = req.user.role;

        if (currentRole !== 'super_admin') {
            return res.status(403).json({ message: 'Hanya Super Admin yang dapat menambahkan pengguna baru' });
        }

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Semua kolom wajib diisi (name, email, password, role)' });
        }

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Role tidak valid. Harus admin atau user.' });
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email.trim(), hashedPassword, role]
        );

        res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentRole = req.user.role;

        // Fetch target user's role and profile image
        const [targetUsers] = await pool.query('SELECT role, profile_image FROM users WHERE id = ?', [id]);
        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const targetUser = targetUsers[0];
        const targetRole = targetUser.role;

        // Rule: admin can only delete user. super_admin can delete admin and user.
        if (currentRole === 'admin' && targetRole !== 'user') {
            return res.status(403).json({ message: 'Admins can only delete normal users' });
        }

        if (targetRole === 'super_admin') {
            return res.status(403).json({ message: 'Super Admins cannot be deleted' });
        }

        // Delete user's profile image if exists
        if (targetUser.profile_image) {
            const cleanPath = targetUser.profile_image.startsWith('/') ? targetUser.profile_image.slice(1) : targetUser.profile_image;
            const fullPath = path.join(__dirname, '..', cleanPath);
            fs.unlink(fullPath, (err) => {
                if (err && err.code !== 'ENOENT') console.log('Error deleting user profile image:', err.message);
            });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;
        const newImage = req.file ? `/uploads/${req.file.filename}` : null;

        // Fetch current user details
        const [currentUsers] = await pool.query('SELECT name, email, profile_image FROM users WHERE id = ?', [userId]);
        if (currentUsers.length === 0) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        const currentUser = currentUsers[0];
        const currentProfileImage = currentUser.profile_image;

        const finalName = name ? name.trim() : currentUser.name;
        const finalEmail = email ? email.trim() : currentUser.email;

        // Check if email is already taken by another user
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [finalEmail, userId]);
        if (existing.length > 0) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(400).json({ message: 'Email sudah terdaftar oleh pengguna lain' });
        }

        let query = 'UPDATE users SET name = ?, email = ?';
        const params = [finalName, finalEmail];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        if (newImage) {
            query += ', profile_image = ?';
            params.push(newImage);

            // Delete old profile image if it exists
            if (currentProfileImage) {
                const cleanOldPath = currentProfileImage.startsWith('/') ? currentProfileImage.slice(1) : currentProfileImage;
                const oldImagePath = path.join(__dirname, '..', cleanOldPath);
                fs.unlink(oldImagePath, (err) => {
                    if (err && err.code !== 'ENOENT') console.log('Error deleting old profile image:', err.message);
                });
            }
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await pool.query(query, params);

        // Fetch updated user to return (including profile_image)
        const [updatedUsers] = await pool.query('SELECT id, name, email, role, profile_image FROM users WHERE id = ?', [userId]);
        const updatedUser = updatedUsers[0];

        res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        console.error('updateProfile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentRole = req.user.role;

        if (!role || !['super_admin', 'admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Role tidak valid.' });
        }

        if (parseInt(id) === parseInt(req.user.id)) {
            return res.status(400).json({ message: 'Anda tidak dapat mengubah role Anda sendiri' });
        }

        // Fetch target user
        const [targetUsers] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        if (targetUsers.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const targetRole = targetUsers[0].role;
        if (targetRole === 'super_admin' && currentRole !== 'super_admin') {
            return res.status(403).json({ message: 'Hanya Super Admin yang dapat mengelola sesama Super Admin' });
        }

        // Enforce admin permissions
        if (currentRole === 'admin' && targetRole !== 'user') {
            return res.status(403).json({ message: 'Admin hanya dapat mengubah role pengguna biasa (user)' });
        }

        if (role === 'super_admin' && currentRole !== 'super_admin') {
            return res.status(403).json({ message: 'Hanya Super Admin yang dapat menaikkan user menjadi Super Admin' });
        }

        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        res.json({ message: 'Role pengguna berhasil diperbarui' });
    } catch (error) {
        console.error('updateUserRole error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUsers, createUser, deleteUser, updateProfile, updateUserRole };
