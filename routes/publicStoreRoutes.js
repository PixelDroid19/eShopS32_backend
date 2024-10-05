const express = require('express');
const router = express.Router();
const publicStoreController = require('../controllers/publicStoreController');

router.get('/:shopUsername/config', publicStoreController.getStoreConfig);
router.get('/:shopUsername/products', publicStoreController.getStoreProducts);
router.get('/:shopUsername/categories', publicStoreController.getStoreCategories);

module.exports = router;
