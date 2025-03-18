const orderDAO = require("../common/dao/orderDAO");
const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const app = express();

app.post("/api/orders", async (req, res) => {
    req.context.log("Creating an Order");
    try {
        const { customerId, userId, items } = req.body;

        if (!customerId || !userId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Missing required fields or items" });
        }

        const newOrder = {
            CUSTOMER_ID: customerId,
            USER_ID: userId,
            DATE_CREATED: new Date(),
            ORDER_STATUS: "PENDING",
            ITEMS: items
        };


        const orderResponse = await orderDAO.createOrder(newOrder);
        res.status(201).json(orderResponse);
    } catch (error) {
        req.context.log("Error creating order", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

app.get("/api/orders", async (req, res) => {
    try {
        const { status, startDate, endDate, customerId } = req.query;
        const orders = await orderDAO.getOrders({ status, startDate, endDate, customerId });
        res.json({ orders });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = createHandler(app);