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
            // Primero, obtenemos la información de las columnas de la tabla
            const [columns] = await clientDb.query('SHOW COLUMNS FROM departamento_inventario');
            const columnNames = columns.map(col => col.Field);

            // Construimos la consulta dinámicamente basada en las columnas existentes
            const selectFields = ['ID_Control', 'Departamento'];
            if (columnNames.includes('Icon')) {
                selectFields.push('Icon');
            }
            const selectQuery = `SELECT ${selectFields.join(', ')} FROM departamento_inventario`;

            const [clientCategories] = await clientDb.query(selectQuery);

            for (const category of clientCategories) {
                const insertQuery = columnNames.includes('Icon')
                    ? 'INSERT INTO shop_categories (id, name, icon, shop_username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon)'
                    : 'INSERT INTO shop_categories (id, name, shop_username) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)';

                const insertValues = columnNames.includes('Icon')
                    ? [
                        category.ID_Control || null,
                        category.Departamento || null,
                        category.Icon || null,
                        clientInfo[0].username
                      ]
                    : [
                        category.ID_Control || null,
                        category.Departamento || null,
                        clientInfo[0].username
                      ];

                await db.promise().query(insertQuery, insertValues);
            }
        } catch (error) {
            console.error('Error al sincronizar categorías:', error);
            // Registramos el error pero continuamos con el proceso
        }

        // Sincronizar productos
        try {
            const [clientProducts] = await clientDb.query('SELECT id, descripcion1, precio1, departamento, descripcion2, imagen FROM inventario');
            
            // Obtener los IDs de productos existentes en la tienda
            const [existingProducts] = await db.promise().query('SELECT id FROM shop_products WHERE shop_username = ?', [clientInfo[0].username]);
            const existingProductIds = new Set(existingProducts.map(p => p.id));

            for (const product of clientProducts) {
                if (!existingProductIds.has(product.id)) {
                    // Si el producto no existe, lo insertamos
                    await db.promise().query(
                        'INSERT INTO shop_products (id, title, price, category, description, image, shop_username) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            product.id,
                            product.descripcion1 || null,
                            product.precio1 || null,
                            product.departamento || null,
                            product.descripcion2 || null,
                            product.imagen || null,
                            clientInfo[0].username
                        ]
                    );
                } else {
                    // Si el producto ya existe, actualizamos sus datos
                    await db.promise().query(
                        'UPDATE shop_products SET title = ?, price = ?, category = ?, description = ?, image = ? WHERE id = ? AND shop_username = ?',
                        [
                            product.descripcion1 || null,
                            product.precio1 || null,
                            product.departamento || null,
                            product.descripcion2 || null,
                            product.imagen || null,
                            product.id,
                            clientInfo[0].username
                        ]
                    );
                }
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