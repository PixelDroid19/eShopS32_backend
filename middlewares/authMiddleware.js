const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], 'secret_key');
        req.user = decoded;
        
        // Extract shopUsername from URL path
        // For routes like /:shopUsername/products
        let shopUsername = req.baseUrl.split('/')[1];
        
        // For routes like /store/:shopUsername/config
        if (req.baseUrl.startsWith('/store')) {
            shopUsername = req.params.shopUsername;
        }
        
        // If there's a shopUsername in the URL and it doesn't match the token's username
        // This validation only applies to routes that include a shopUsername
        if (shopUsername && shopUsername !== 'auth' && shopUsername !== 'user' && 
            shopUsername !== 'sync' && shopUsername !== 'orders' && 
            shopUsername !== 'store' && decoded.username !== shopUsername) {
            return res.status(403).json({ 
                message: 'Token inválido para esta tienda' 
            });
        }
        
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const verifyShopAccess = (req, res, next) => {
    // Extract shopUsername from URL path
    // For routes like /:shopUsername/products
    let shopUsername = req.baseUrl.split('/')[1];
    
    // For routes like /store/:shopUsername/config
    if (req.baseUrl.startsWith('/store')) {
        shopUsername = req.params.shopUsername;
    }
    
    // Check if the user has access to this shop
    if (req.user.username !== shopUsername) {
        return res.status(403).json({ 
            message: 'No tienes permiso para acceder a esta tienda' 
        });
    }
    
    next();
};

module.exports = {
    verifyToken,
    verifyShopAccess
};