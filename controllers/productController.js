// Importar la configuración de la base de datos
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Create a cache instance with standard TTL of 5 minutes
const productCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Create rate limiter with more restrictive settings for high traffic
const productsLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 30, // limit each IP to 30 requests per windowMs
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip, // Use IP for rate limiting
    skip: (req) => req.method === 'OPTIONS' // Skip preflight requests
});

// Apply rate limiter to getProducts with connection pooling
exports.getProducts = [productsLimiter, (req, res) => {
    // Add request timeout
    req.setTimeout(5000, () => {
        res.status(408).json({ message: 'Request timeout' });
    });
    // Obtener parámetros de paginación, categoría, precio mínimo y máximo de la consulta
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const sortBy = req.query.sortBy || 'id';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const search = req.query.search ? req.query.search.trim() : '';
    const shopUsername = req.baseUrl.split('/')[1];
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
    }
    
    // Create a cache key based on all query parameters
    const cacheKey = `products_${shopUsername}_${page}_${limit}_${category || ''}_${minPrice || ''}_${maxPrice || ''}_${sortBy}_${order}_${search}`;
    
    // Check if we have a cached result
    const cachedResult = productCache.get(cacheKey);
    if (cachedResult) {
        return res.json(cachedResult);
    }
    
    // Optimize the query by using a subquery for price conversion
    let query = `
        WITH product_prices AS (
            SELECT *, 
                CAST(REPLACE(REPLACE(price, '.', ''), ',', '.') AS DECIMAL(10,2)) AS price_numeric 
            FROM shop_products 
            WHERE shop_username = ? 
            AND is_active = TRUE
        )
    `;
    
    let mainQuery = 'SELECT * FROM product_prices WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM product_prices WHERE 1=1';
    let queryParams = [shopUsername];
    
    // Validate price range
    if ((minPrice && maxPrice) && (minPrice > maxPrice)) {
        return res.status(400).json({ message: 'El precio mínimo no puede ser mayor que el precio máximo' });
    }
    
    // Add filters
    if (category) {
        mainQuery += ' AND category = ?';
        countQuery += ' AND category = ?';
        queryParams.push(category);
    }
    
    if (search) {
        mainQuery += ' AND title LIKE ?';
        countQuery += ' AND title LIKE ?';
        queryParams.push(`%${search}%`);
    }
    
    if (minPrice) {
        mainQuery += ' AND price_numeric >= ?';
        countQuery += ' AND price_numeric >= ?';
        queryParams.push(minPrice);
    }
    
    if (maxPrice) {
        mainQuery += ' AND price_numeric <= ?';
        countQuery += ' AND price_numeric <= ?';
        queryParams.push(maxPrice);
    }
    
    // Add sorting
    mainQuery += sortBy === 'price' 
        ? ` ORDER BY price_numeric ${order}` 
        : ` ORDER BY ${sortBy} ${order}`;
    
    // Add pagination
    mainQuery += ' LIMIT ? OFFSET ?';
    const paginationParams = [...queryParams, limit, offset];
    
    // Use Promise.all to run queries concurrently
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(query + countQuery, queryParams, (error, results) => {
                if (error) reject(error);
                else resolve(results[0].total);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(query + mainQuery, paginationParams, (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        })
    ])
    .then(([totalProducts, products]) => {
        // Handle no products found
        if (totalProducts === 0) {
            if (category) {
                return res.status(404).json({ 
                    message: 'No se encontraron productos para la categoría especificada'
                });
            }
            return res.json({
                products: [],
                currentPage: page,
                totalPages: 0,
                totalProducts: 0
            });
        }

        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / limit);

        // Create response object
        const responseData = {
            products,
            currentPage: page,
            totalPages,
            totalProducts
        };
        
        // Cache the result
        productCache.set(cacheKey, responseData);

        // Send response with products and pagination metadata
        res.json(responseData);
    })
    .catch(error => {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    });
}];
/*
Ejemplos de uso:
Para obtener todos los productos: GET /products
Para paginar: GET /products?page=1&limit=10
Para filtrar por categoría: GET /products?category=1
Para combinar paginación y filtrado: GET /products?page=1&limit=10&category=1 
*/

exports.deleteProduct = (req, res) => {
    const productId = req.params.id;
    const shopUsername = req.baseUrl.split('/')[1]

    const updateQuery = 'UPDATE shop_products SET is_active = FALSE WHERE id = ? AND shop_username = ?';

    db.query(updateQuery, [productId, shopUsername], (error, results) => {
        if (error) {
            console.error('Error al desactivar el producto:', error);
            return res.status(500).json({ message: 'Error al desactivar el producto' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no pertenece a esta tienda' });
        }
        
        // Invalidate cache when a product is deleted
        productCache.flushAll();

        res.status(200).json({ message: 'Producto desactivado exitosamente' });
    });
};

exports.updateProduct = (req, res) => {
    const productId = req.params.id;
    const shopUsername = req.baseUrl.split('/')[1]
    const { title, price, category, description, image } = req.body;

    const updateQuery = 
        'UPDATE shop_products SET title = ?, price = ?, category = ?, description = ?, image = ? WHERE id = ? AND shop_username = ?';

    db.query(updateQuery, [title, price, category, description, image, productId, shopUsername], (error, results) => {
        if (error) {
            console.error('Error al actualizar el producto:', error);
            return res.status(500).json({ message: 'Error al actualizar el producto' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado o no pertenece a esta tienda' });
        }
        
        // Invalidate cache when a product is updated
        productCache.flushAll();

        res.status(200).json({ message: 'Producto actualizado exitosamente' });
    });
};

exports.addProduct = (req, res) => {
    const { title, price, category, description, image, shop_username } = req.body;

    const insertQuery = 
        'INSERT INTO shop_products (title, price, category, description, image, shop_username, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)';

    db.query(insertQuery, [title, price, category, description, image, shop_username], (error, results) => {
        if (error) {
            console.error('Error al añadir el producto:', error);
            return res.status(500).json({ message: 'Error al añadir el producto', error: error });
        }
        
        // Invalidate cache when a new product is added
        productCache.flushAll();

        res.status(201).json({ 
            message: 'Producto añadido exitosamente',
            productId: results.insertId
        });
    });
};
