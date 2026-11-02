const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Semua kolom wajib diisi' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format email tidak valid' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal terdiri dari 6 karakter' });
        }

        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name.trim(), email.trim(), hashedPassword, 'user']);
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Silakan isi email dan password' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email tidak terdaftar' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'supersecretkey123',
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_image: user.profile_image } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Silakan isi email dan password baru' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
        }

        const [users] = await pool.query('SELECT id, role FROM users WHERE email = ?', [email.trim()]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email tidak ditemukan dalam sistem' });
        }

        const user = users[0];
        // Security check: Super admin / Admin cannot be reset through public forgot-password
        if (user.role === 'super_admin' || user.role === 'admin') {
            return res.status(403).json({ message: 'Akun Administrator tidak dapat diatur ulang secara publik. Hubungi Super Admin sistem.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.trim()]);

        res.json({ message: 'Password berhasil diubah, silakan masuk dengan password baru' });
    } catch (error) {
        console.error('ForgotPassword error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, forgotPassword };
