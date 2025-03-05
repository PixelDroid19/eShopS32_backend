const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, verifyShopAccess } = require('../middlewares/authMiddleware');

router.get('/', productController.getProducts);
router.post('/', verifyToken, verifyShopAccess, productController.addProduct);
router.delete('/:id', verifyToken, verifyShopAccess, productController.deleteProduct);
router.put('/:id', verifyToken, verifyShopAccess, productController.updateProduct);

module.exports = router;
