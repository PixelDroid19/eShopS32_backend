const db = require('../config/db');

exports.createOrder = (req, res) => {
    const { IDNumber, phoneNumber, customInvoiceRequired, name, address, email, items, total } = req.body;


    if (!phoneNumber || !email) {
        return res.status(400).json({ message: 'El número de teléfono y el correo electrónico son obligatorios' });
    }

    const customInvoice = customInvoiceRequired === true || customInvoiceRequired === 1 || customInvoiceRequired === '1' ? 1 : 0;

    if (customInvoice === 1) {
        if (!name || !IDNumber) {
            return res.status(400).json({ message: 'El nombre y el número de identificación son obligatorios cuando se requiere factura personalizada' });
        }
    }

    const orderValues = [
        customInvoice === 1 ? IDNumber : null,
        phoneNumber,
        customInvoice,
        customInvoice === 1 ? name : null,
        address || null,
        email,
        total
    ];

    const orderQuery = `
        INSERT INTO shop_orders (id_number, phone_number, custom_invoice_required, name_user, address, email, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(orderQuery, orderValues, (error, results) => {
        if (error) {
            console.error('Error al crear la orden:', error);
            return res.status(500).json({ message: 'Error al crear la orden' });
        }

        const orderId = results.insertId;

        const itemQuery = `
            INSERT INTO shop_order_items (order_id, product_id, title, price, quantity)
            VALUES ?
        `;

        const itemValues = items.map(item => [orderId, item.id, item.title, item.price, item.quantity]);

        db.query(itemQuery, [itemValues], (error) => {
            if (error) {
                console.error('Error al insertar los items de la orden:', error);
                return res.status(500).json({ message: 'Error al crear los items de la orden' });
            }

            // Consulta para obtener los detalles completos de la orden
            const getOrderDetailsQuery = `
                SELECT o.*, oi.*, p.*
                FROM shop_orders o
                JOIN shop_order_items oi ON o.id = oi.order_id
                JOIN shop_products p ON oi.product_id = p.id
                WHERE o.id = ?
            `;

            db.query(getOrderDetailsQuery, [orderId], (error, orderDetails) => {
                if (error) {
                    console.error('Error al obtener los detalles de la orden:', error);
                    return res.status(500).json({ message: 'Error al obtener los detalles de la orden' });
                }

                // Estructurar los detalles de la orden
                const orderInfo = orderDetails[0];
                const orderItems = orderDetails.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    product: {
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        category: item.category,
                        description: item.description,
                        image: item.image
                    }
                }));

                const completeOrderDetails = {
                    id: orderInfo.id,
                    id_number: orderInfo.id_number,
                    phone_number: orderInfo.phone_number,
                    custom_invoice_required: orderInfo.custom_invoice_required,
                    name_user: orderInfo.name_user,
                    address: orderInfo.address,
                    email: orderInfo.email,
                    total: orderInfo.total,
                    items: orderItems
                };

                res.status(201).json({
                    message: 'Orden creada exitosamente',
                    order: completeOrderDetails
                });
            });
        });
    });
};
