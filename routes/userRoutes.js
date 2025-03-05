const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.put('/config/:id', verifyToken, userController.updateConfig); // Ruta para actualizar la configuración del usuario administrador

module.exports = router;