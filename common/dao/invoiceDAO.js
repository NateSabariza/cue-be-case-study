const { executeQuery, sql } = require("../config/db");
const orderModel = require("../model/order");

module.exports = {
    async createInvoice(orderId) {
        // Checks if order exists
        const orderQuery = `
            SELECT O.ORDER_ID, O.ORDER_STATUS 
            FROM dbo.[ORDER] O 
            WHERE ORDER_ID = @ORDER_ID`;
        
        const params = [{ name: "ORDER_ID", type: sql.Int, value: orderId.ORDER_ID }];

        try {
            console.log('Retrieving Order...');
            const orderResult = await executeQuery(orderQuery, params);
            
            if (orderResult.length === 0) {
                throw new Error("Order not found.");
            }
            
            const status = orderResult[0].ORDER_STATUS;
            
            if (status.toUpperCase() !== 'FULFILLED') {
                return { message: "Order is not yet fulfilled." };
            }
            
            // Generate new INVOICE_ID manually
            const invoiceQuery = `SELECT TOP 1 INVOICE_ID FROM dbo.[INVOICE] ORDER BY INVOICE_ID DESC`;
            const lastInvoiceResult = await executeQuery(invoiceQuery);

            let newInvoiceId = 1; // Default if no invoices exist
            if (lastInvoiceResult.length > 0) {
                newInvoiceId = lastInvoiceResult[0].INVOICE_ID + 1;
            }
            
            // Create Invoice
            const insertInvoiceQuery = `
                INSERT INTO dbo.[INVOICE] (INVOICE_ID, INVOICE_STATUS, INVOICE_DATE, ORDER_ID) 
                VALUES (@INVOICE_ID, @INVOICE_STATUS, @INVOICE_DATE, @ORDER_ID)`;
            
            const invoiceDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(invoiceDate.getDate() + 30); // Assuming 30 days payment terms
            
            const invoiceParams = [
                { name: "INVOICE_ID", type: sql.Int, value: newInvoiceId },
                { name: "INVOICE_STATUS", type: sql.NChar(10), value: "BILLED" },
                { name: "INVOICE_DATE", type: sql.DateTime, value: invoiceDate },
                { name: "ORDER_ID", type: sql.Int, value: orderId.ORDER_ID }
            ];
            
            console.log('Creating Invoice...');
            await executeQuery(insertInvoiceQuery, invoiceParams);
            
            // Retrieve order details
            const orderDetailsQuery = `
                SELECT PRODUCT_ID, QUANTITY, PRICE 
                FROM dbo.[ORDER_DETAILS] 
                WHERE ORDER_ID = @ORDER_ID`;
            
            console.log('Retrieving Order Details...');
            const orderDetails = await executeQuery(orderDetailsQuery, params);
            
            let totalCost = 0;
            
            // Insert into INVOICE_DETAILS
            for (const detail of orderDetails) {
                const invoiceDetailsQuery = `
                    INSERT INTO dbo.[INVOICE_DETAILS] (INVOICE, PRODUCT_ID, QUANTITY, PRICE) 
                    VALUES (@INVOICE, @PRODUCT_ID, @QUANTITY, @PRICE)`;
                
                const invoiceDetailsParams = [
                    { name: "INVOICE", type: sql.Int, value: newInvoiceId },
                    { name: "PRODUCT_ID", type: sql.Int, value: detail.PRODUCT_ID },
                    { name: "QUANTITY", type: sql.Float, value: detail.QUANTITY },
                    { name: "PRICE", type: sql.Float, value: detail.PRICE }
                ];
                
                totalCost += detail.QUANTITY * detail.PRICE;
                
                await executeQuery(invoiceDetailsQuery, invoiceDetailsParams);
            }
            
            // Update ORDER_STATUS to BILLED
            const updateOrderStatusQuery = `
                UPDATE dbo.[ORDER] 
                SET ORDER_STATUS = @ORDER_STATUS 
                WHERE ORDER_ID = @ORDER_ID`;
            
            const updateOrderStatusParams = [
                { name: "ORDER_STATUS", type: sql.NChar(10), value: "BILLED" },
                { name: "ORDER_ID", type: sql.Int, value: orderId.ORDER_ID }
            ];
            
            console.log('Updating Order Status...');
            await executeQuery(updateOrderStatusQuery, updateOrderStatusParams);
            
            return {
                invoiceId: newInvoiceId,
                status: "BILLED",
                totalCost: totalCost.toFixed(2),
                dueDate: dueDate.toISOString().split('T')[0]
            };
        } catch (error) {
            throw new Error("Error creating invoice: " + error.message);
        }
    }
};
