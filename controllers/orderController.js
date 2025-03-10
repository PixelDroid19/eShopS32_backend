const db = require('../config/db');

// Función para crear una nueva orden
exports.createOrder = (req, res) => {
    const { IDNumber, phonePrefix, phoneNumber, customInvoiceRequired, name, address, email, items, total, country, shop_id } = req.body;

    // Combinar el prefijo y el número de teléfono
    const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

    // Validar campos obligatorios
    if (!fullPhoneNumber || !email) {
        return res.status(400).json({ message: 'El número de teléfono y el correo electrónico son obligatorios' });
    }

    // Determinar si se requiere factura personalizada
    const customInvoice = customInvoiceRequired === true ? 1 : 0;

    // Validar campos adicionales para factura personalizada
    if (customInvoice === 1) {
        if (!name || !IDNumber) {
            return res.status(400).json({ message: 'El nombre y el número de identificación son obligatorios cuando se requiere factura personalizada' });
        }
    }

    // Preparar valores para la inserción de la orden
    const orderValues = [
        customInvoice === 1 ? IDNumber : null,
        fullPhoneNumber,
        customInvoice,
        customInvoice === 1 ? name : null,
        address || null,
        email,
        total.toString(), // Convertir a string para asegurar que se guarde como se recibió
        country,
        shop_id
    ];

    // Consulta SQL para insertar la orden
    const orderQuery = `
        INSERT INTO shop_orders (id_number, phone_number, custom_invoice_required, name_user, address, email, total, country, shop_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta para crear la orden
    db.query(orderQuery, orderValues, (error, results) => {
        if (error) {
            console.error('Error al crear la orden:', error);
            return res.status(500).json({ message: 'Error al crear la orden' });
        }

        const orderId = results.insertId;

        // Consulta SQL para insertar los items de la orden
        const itemQuery = `
            INSERT INTO shop_order_items (order_id, product_id, price_at_time, quantity)
            VALUES ?
        `;

        // Preparar valores para la inserción de items
        const itemValues = items.map(item => [
            orderId, 
            item.id, 
            item.price,
            item.quantity
        ]);

        // Ejecutar la consulta para insertar los items
        db.query(itemQuery, [itemValues], (error) => {
            if (error) {
                console.error('Error al insertar los items de la orden:', error);
                return res.status(500).json({ message: 'Error al crear los items de la orden' });
            }

            // Modificar la consulta para obtener los detalles de la orden
            const getOrderDetailsQuery = `
                SELECT o.id, o.id_number, o.phone_number, o.custom_invoice_required, o.name_user, 
                       o.address, o.email, o.total, o.created_at, o.country, o.shop_id,
                       oi.price_at_time, oi.quantity,
                       p.id AS product_id, p.shop_username, p.title, p.price, p.category, p.description
                FROM shop_orders o
                JOIN shop_order_items oi ON o.id = oi.order_id
                JOIN shop_products p ON oi.product_id = p.id
                WHERE o.id = ?
            `;

            // Ejecutar la consulta para obtener los detalles de la orden
            db.query(getOrderDetailsQuery, [orderId], (error, orderDetails) => {
                if (error) {
                    console.error('Error al obtener los detalles de la orden:', error);
                    return res.status(500).json({ message: 'Error al obtener los detalles de la orden' });
                }

                // Estructurar los detalles de la orden
                const orderInfo = orderDetails[0];
                const items = orderDetails.map(item => ({
                    price_at_time: item.price_at_time,
                    quantity: item.quantity,
                    product: {
                        id: item.product_id,
                        shop_username: item.shop_username,
                        title: item.title,
                        price: item.price,
                        category: item.category,
                        description: item.description
                    }
                }));

                // Crear objeto con los detalles completos de la orden
                const completeOrderDetails = {
                    id: orderInfo.id,
                    id_number: orderInfo.id_number,
                    phone_number: orderInfo.phone_number,
                    custom_invoice_required: orderInfo.custom_invoice_required,
                    name_user: orderInfo.name_user,
                    address: orderInfo.address,
                    email: orderInfo.email,
                    created_at: orderInfo.created_at,
                    country: orderInfo.country,
                    shop_id: orderInfo.shop_id,
                    items: items,
                    total: orderInfo.total
                };

                // Enviar respuesta con los detalles de la orden creada
                res.status(201).json({
                    message: 'Orden creada exitosamente',
                    order: completeOrderDetails
                });
            });
        });
    });
};