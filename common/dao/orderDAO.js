const { executeQuery, sql } = require("../config/db");
const orderModel = require("../model/order")

module.exports = {
    async createOrder(order) {
        // Step 1: Generate PO Number (Auto-Increment)
        const poQuery = `SELECT TOP 1 PO_NUMBER FROM dbo.[ORDER] ORDER BY ORDER_ID DESC`;
        const lastPoResult = await executeQuery(poQuery);

        let newPoNumber = "PO-000000001"; // Default if no orders exist
        if (lastPoResult.length > 0) {
            const lastPo = lastPoResult[0].PO_NUMBER;
            const lastPoNum = parseInt(lastPo.replace("PO-", ""), 10) + 1;
            newPoNumber = `PO-${lastPoNum.toString().padStart(9, "0")}`;
        }

        const orderQuery = `
            INSERT INTO dbo.[ORDER] (CUSTOMER_ID, USER_ID, DATE_CREATED, PO_NUMBER, ORDER_STATUS)
            OUTPUT INSERTED.ORDER_ID
            VALUES (@CUSTOMER_ID, @USER_ID, @DATE_CREATED, @PO_NUMBER, @ORDER_STATUS)
        `;

        const orderParams = [
            { name: "CUSTOMER_ID", type: sql.Int, value: order.CUSTOMER_ID },
            { name: "USER_ID", type: sql.Int, value: order.USER_ID },
            { name: "DATE_CREATED", type: sql.DateTime, value: order.DATE_CREATED },
            { name: "PO_NUMBER", type: sql.VarChar(50), value: newPoNumber },
            { name: "ORDER_STATUS", type: sql.VarChar(10), value: order.ORDER_STATUS }
        ];

        try {
            // Insert order and get ORDER_ID
            const orderResult = await executeQuery(orderQuery, orderParams);
            const orderId = orderResult[0].ORDER_ID;

            let totalCost = 0;

            // Insert order details
            const orderDetailQuery = `
                INSERT INTO dbo.ORDER_DETAILS (ORDER_ID, PRODUCT_ID, QUANTITY, PRICE)
                VALUES (@ORDER_ID, @PRODUCT_ID, @QUANTITY, @PRICE)
            `;

            for (const item of order.ITEMS) {
                // Fetch the product price
                const priceQuery = `
                    SELECT PRICE FROM dbo.PRODUCT WHERE PRODUCT_ID = @PRODUCT_ID
                `;
                const priceResult = await executeQuery(priceQuery, [
                    { name: "PRODUCT_ID", type: sql.Int, value: item.productId }
                ]);

                if (priceResult.length === 0) {
                    throw new Error(`Product with ID ${item.productId} not found`);
                }

                const price = priceResult[0].PRICE;
                const totalPricePerItem = price * item.quantity;

                const orderDetailParams = [
                    { name: "ORDER_ID", type: sql.Int, value: orderId },
                    { name: "PRODUCT_ID", type: sql.Int, value: item.productId },
                    { name: "QUANTITY", type: sql.Int, value: item.quantity },
                    { name: "PRICE", type: sql.Decimal(18, 2), value: totalPricePerItem }
                ];

                await executeQuery(orderDetailQuery, orderDetailParams);

                totalCost += price * item.quantity;
            }

            return orderModel.formatOrderResponse(orderId, "Pending", totalCost);
        } catch (error) {
            throw new Error("Error creating order: " + error.message);
        }
    },

    async getOrderDetailsById(orderId) {
        try {
            const orderQuery = `
                SELECT O.ORDER_ID, O.CUSTOMER_ID, O.USER_ID, O.DATE_CREATED, O.PO_NUMBER, O.ORDER_STATUS, 
                       OD.PRODUCT_ID, OD.QUANTITY, OD.PRICE
                FROM dbo.[ORDER] O
                LEFT JOIN dbo.ORDER_DETAILS OD ON O.ORDER_ID = OD.ORDER_ID
                LEFT JOIN dbo.PRODUCT P ON OD.PRODUCT_ID = P.PRODUCT_ID
                WHERE O.ORDER_ID = @ORDER_ID
            `;

            const orderParams = [{ name: "ORDER_ID", type: sql.Int, value: orderId }];
            const orderResult = await executeQuery(orderQuery, orderParams);

            if (orderResult.length === 0) {
                return null;
            }

            return orderModel.mapOrder(orderResult);
        } catch (error) {
            throw new Error("Error retrieving order details: " + error.message);
        }
    }
};
