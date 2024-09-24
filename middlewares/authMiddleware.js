const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], 'secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;