const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 's3-la.com',
    user: 'slacom_s3root',
    password: 'S3Latin#2018#01', 
    database: 'slacom_s3tools',
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos MySQL.');
    }
});

module.exports = db;