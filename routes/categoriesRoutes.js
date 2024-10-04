const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', categoriesController.getAllCategories); // Ruta para obtener todas las categorías

module.exports = router;