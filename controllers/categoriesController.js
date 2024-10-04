const db = require('../config/db');

exports.getAllCategories = (req, res) => {
    const query = 'SELECT id, name, icon FROM shop_categories';

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener las categorías: ', error);
            return res.status(500).json({ message: 'Error al obtener las categorías' });
        }

        res.json(results);
    });
};

