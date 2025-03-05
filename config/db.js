require('dotenv').config(); 
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 100,
    queueLimit: 0,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Pool de conexiones MySQL establecido.');
    connection.release();
});

module.exports = db;