const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/all', verifyToken, categoriesController.getAllCategories);

module.exports = router;