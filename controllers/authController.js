const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const sql = 'SELECT * FROM shop_cuentas WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en la consulta' });
        if (results.length === 0) return res.status(400).json({ message: 'Usuario no encontrado' });

        const user = results[0];
        if (password !== user.password) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const permissions = [];
        if (user.is_user) permissions.push("user");
        if (user.is_admin) permissions.push("admin");
        if (user.can_customize) permissions.push("customization");

        const token = jwt.sign({ 
            id: user.id,
            username: user.username 
        }, 'secret_key', { expiresIn: '1h' });

        // Eliminar datos sensibles directamente del objeto user
        delete user.password;
        delete user.admin_server;
        delete user.admin_user;
        delete user.admin_password;
        delete user.admin_database;
        delete user.admin_port;

        res.json({ 
            message: 'Inicio de sesión exitoso', 
            token, 
            user: {
                ...user,
                permissions
            }
        });
    });
};
