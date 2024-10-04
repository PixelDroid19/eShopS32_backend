const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/:userId', verifyToken, syncController.syncData);

module.exports = router;