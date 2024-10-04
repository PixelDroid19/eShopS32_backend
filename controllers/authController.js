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

        // Asumimos que los permisos están almacenados en la base de datos
        // Si no es así, ajusta esta parte según sea necesario
        const permissions = [];
        if (user.is_user) permissions.push("user");
        if (user.is_admin) permissions.push("admin");
        if (user.can_customize) permissions.push("customization");

        const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
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
