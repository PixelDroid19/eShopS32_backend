const db = require('../config/db');

exports.getStoreConfig = async (req, res) => {
    const { shopUsername } = req.params;

    try {
        const [storeConfig] = await db.promise().query(
            'SELECT title, backgroundColor, headerColor, headerTextColor, textColor, primaryColor, secondaryColor, buttonColor, buttonTextColor, buttonHoverOpacity, buttonFontSize, buttonBorderRadius, asideColor, logo, language, mainFont, address, phone, email, facebook, instagram, twitter, whatsappNumber, heroBgGradient, heroTextColor, heroTitle, heroSubtitle, heroButtonText, heroButtonColorScheme, heroImage, featuresTitle, featuresSubtitle, features FROM shop_cuentas WHERE username = ?',
            [shopUsername]
        );

        if (!storeConfig) {
            return res.status(404).json({ message: 'Tienda no encontrada' });
        }

        res.json(storeConfig);
    } catch (error) {
        console.error('Error al obtener la configuración de la tienda:', error);
        res.status(500).json({ message: 'Error al obtener la configuración de la tienda' });
    }
};

exports.getStoreProducts = async (req, res) => {
    const { shopUsername } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    try {
        let query = 'SELECT * FROM shop_products WHERE shop_username = ? AND is_active = TRUE';
        let countQuery = 'SELECT COUNT(*) as total FROM shop_products WHERE shop_username = ? AND is_active = TRUE';
        let queryParams = [shopUsername];

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            queryParams.push(category);
        }

        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [countResults] = await db.promise().query(countQuery, queryParams);
        const totalProducts = countResults[0].total;

        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No se encontraron productos para esta tienda' });
        }

        const totalPages = Math.ceil(totalProducts / limit);
        const [products] = await db.promise().query(query, queryParams);

        res.json({
            products,
            currentPage: page,
            totalPages,
            totalProducts
        });
    } catch (error) {
        console.error('Error al obtener los productos de la tienda:', error);
        res.status(500).json({ message: 'Error al obtener los productos de la tienda' });
    }
};

exports.getStoreCategories = async (req, res) => {
    const { shopUsername } = req.params;

    try {
        const [categories] = await db.promise().query(
            'SELECT id, name, icon FROM shop_categories WHERE shop_username = ?',
            [shopUsername]
        );

        res.json(categories);
    } catch (error) {
        console.error('Error al obtener las categorías de la tienda:', error);
        res.status(500).json({ message: 'Error al obtener las categorías de la tienda' });
    }
};
