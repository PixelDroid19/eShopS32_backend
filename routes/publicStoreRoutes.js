const express = require('express');
const router = express.Router();
const publicStoreController = require('../controllers/publicStoreController');
const { verifyToken, verifyShopAccess } = require('../middlewares/authMiddleware');

router.get('/:shopUsername/config', publicStoreController.getStoreConfig);
router.get('/:shopUsername/categories', publicStoreController.getStoreCategories);

// Protected routes that require authentication and shop access verification
router.get('/:shopUsername/protected-data', verifyToken, verifyShopAccess, publicStoreController.getStoreConfig);

// Endpoint to validate token against a specific store
router.post('/:shopUsername/validate-token', verifyToken, verifyShopAccess, (req, res) => {
    // If middleware passes, the token is valid for this store
    res.json({ valid: true, username: req.user.username });
});

module.exports = router;
