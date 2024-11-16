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
