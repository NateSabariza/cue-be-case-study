const orderDAO = require("../common/dao/orderDAO");
const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const app = express();

app.get("/api/order/:orderId", 
    async(req, res) => {
        req.context.log(`Getting Order Details for Order ID: ${req.params.orderId}`);
        try {
            const order = await orderDAO.getOrderDetailsById(req.params.orderId);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
            res.json(order);
        } catch {
            res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
);


module.exports = createHandler(app);