const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const productRoutes = require('./routes/productRoutes');
const syncRoutes = require('./routes/syncRoutes');
const orderRoutes = require('./routes/orderRoutes');
const publicStoreRoutes = require('./routes/publicStoreRoutes');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Rutas
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/:shopUsername/products', productRoutes);
app.use('/sync', syncRoutes);
app.use('/orders', orderRoutes);
app.use('/store', publicStoreRoutes);

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
