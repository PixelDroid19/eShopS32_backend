// Importar la configuración de la base de datos
const db = require('../config/db');

// Exportar la función para obtener productos
exports.getProducts = (req, res) => {
    // Obtener parámetros de paginación, categoría, precio mínimo y máximo de la consulta
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const sortBy = req.query.sortBy || 'id'; // Ordenar por defecto por ID
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC'; // Orden ascendente por defecto
    const search = req.query.search ? req.query.search.trim() : ''; // Capturar el término de búsqueda

    let query = 'SELECT * FROM shop_products';
    let countQuery = 'SELECT COUNT(*) as total FROM shop_products';
    let queryParams = [];

    // Validar que el precio mínimo no sea mayor que el máximo
    if ((minPrice && maxPrice) && (minPrice > maxPrice)) {
        return res.status(400).json({ message: 'El precio mínimo no puede ser mayor que el precio máximo' });
    }

    // Si se proporciona una categoría, añadir el filtro a las consultas
    if (category) {
        query += ' WHERE category = ?';
        countQuery += ' WHERE category = ?';
        queryParams.push(category);
    }

    // Añadir filtro de búsqueda
    if (search) {
        query += (queryParams.length ? ' AND' : ' WHERE') + ' title LIKE ?';
        countQuery += (queryParams.length ? ' AND' : ' WHERE') + ' title LIKE ?';
        queryParams.push(`%${search}%`); // Búsqueda parcial
    }

    // Añadir filtros de precio
    if (minPrice) {
        query += (queryParams.length ? ' AND' : ' WHERE') + ' price >= ?';
        countQuery += (queryParams.length ? ' AND' : ' WHERE') + ' price >= ?';
        queryParams.push(minPrice);
    }
    if (maxPrice) {
        query += (queryParams.length ? ' AND' : ' WHERE') + ' price <= ?';
        countQuery += (queryParams.length ? ' AND' : ' WHERE') + ' price <= ?';
        queryParams.push(maxPrice);
    }

    // Añadir ordenamiento
    query += ` ORDER BY ${sortBy} ${order}`;

    // Añadir límite y offset para la paginación
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Ejecutar la consulta para contar el total de productos
    db.query(countQuery, queryParams, (error, countResults) => {
        if (error) {
            console.error('Error al contar productos:', error);
            return res.status(500).json({ message: 'Error al obtener productos' });
        }

        // Obtener el total de productos
        const totalProducts = countResults[0].total;

        // Si no hay productos para la categoría especificada, devolver un error 404
        if (totalProducts === 0 && category) {
            return res.status(404).json({ message: 'No se encontraron productos para la categoría especificada' });
        }

        // Calcular el total de páginas
        const totalPages = Math.ceil(totalProducts / limit);

        // Ejecutar la consulta principal para obtener los productos
        db.query(query, queryParams, (error, results) => {
            if (error) {
                console.error('Error al obtener productos:', error);
                return res.status(500).json({ message: 'Error al obtener productos' });
            }

            // Devolver la respuesta con los productos y la información de paginación
            res.json({
                products: results,
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts
            });
        });
    });
};

/*
Ejemplos de uso:
Para obtener todos los productos: GET /products
Para paginar: GET /products?page=1&limit=10
Para filtrar por categoría: GET /products?category=1
Para combinar paginación y filtrado: GET /products?page=1&limit=10&category=1 
*/
