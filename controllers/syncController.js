const db = require('../config/db');
const mysql = require('mysql2/promise');

exports.syncData = async (req, res) => {
    const { userId } = req.params;

    try {
        // Obtener la información de conexión del cliente
        const [clientInfo] = await db.promise().query('SELECT * FROM shop_cuentas WHERE id = ?', [userId]);

        if (!clientInfo.length) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { admin_server, admin_user, admin_password, admin_database, admin_port } = clientInfo[0];

        // Validar que todos los datos de conexión estén presentes
        if (!admin_server || !admin_user || !admin_password || !admin_database || !admin_port) {
            return res.status(400).json({ message: 'Datos de conexión incompletos' });
        }

        // Crear conexión a la base de datos del cliente
        let clientDb;
        try {
            clientDb = await mysql.createConnection({
                host: admin_server,
                user: admin_user,
                password: admin_password,
                database: admin_database,
                port: admin_port
            });
        } catch (error) {
            return res.status(500).json({ message: 'Error al conectar con la base de datos del cliente', error: error.message });
        }

        // Sincronizar categorías
        try {
            const [clientCategories] = await clientDb.query('SELECT ID_Control, Departamento, Icon FROM departamento_inventario');
            for (const category of clientCategories) {
                await db.promise().query(
                    'INSERT INTO shop_categories (id, name, icon) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, icon = ?',
                    [
                        category.ID_Control || null,
                        category.Departamento || null,
                        category.Icon || null,
                        category.Departamento || null,
                        category.Icon || null
                    ]
                );
            }
        } catch (error) {
            console.error('Error al sincronizar categorías:', error);
        }

        // Sincronizar productos
        try {
            const [clientProducts] = await clientDb.query('SELECT id, descripcion1, precio1, departamento, descripcion2, imagen FROM inventario');
            for (const product of clientProducts) {
                await db.promise().query(
                    'INSERT INTO shop_products (id, title, price, category, description, image) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?, price = ?, category = ?, description = ?, image = ?',
                    [
                        product.id || null,
                        product.descripcion1 || null,
                        product.precio1 || null,
                        product.departamento || null,
                        product.descripcion2 || null,
                        product.imagen || null,
                        product.descripcion1 || null,
                        product.precio1 || null,
                        product.departamento || null,
                        product.descripcion2 || null,
                        product.imagen || null
                    ]
                );
            }
        } catch (error) {
            console.error('Error al sincronizar productos:', error);
        }

        await clientDb.end();

        res.json({ message: 'Sincronización completada con éxito' });
    } catch (error) {
        console.error('Error durante la sincronización:', error);
        res.status(500).json({ message: 'Error durante la sincronización', error: error.message });
    }
};