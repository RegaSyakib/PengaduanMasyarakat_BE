const express = require('express');
const router = express.Router();
const { addResponse, deleteResponse } = require('../controllers/responseController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.post('/', verifyToken, verifyAdmin, addResponse);
router.delete('/:id', verifyToken, verifyAdmin, deleteResponse);

module.exports = router;
