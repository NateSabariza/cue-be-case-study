const orderDAO = require("../common/dao/invoiceDAO");
const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const app = express();

app.post("/api/invoice", async (req, res) => {
    req.context.log("Creating Invoice");
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "Missing Order Id" });
        }

        const params = {
            ORDER_ID: orderId
        };

        const orderResponse = await orderDAO.createInvoice(params);
        res.status(201).json(orderResponse);
    } catch (error) {
        req.context.log("Error creating order", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = createHandler(app);