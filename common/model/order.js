class Order {
    constructor(orderId, status, customerId, totalCost, createdDate){
        this.orderId = orderId;
        this.status = status;
        this.customerId = customerId;
        this.items = [];
        this.totalCost = totalCost;
        this.createdDate = createdDate;
    }

    addItems(orderItems){
        this.items = orderItems;
    }
}

class Items {
    constructor(productId, quantity, price) {
        this.productId = productId;
        this.quantity = quantity;
        this.price = price;
    }
}

class OrderResponse {
    constructor(orderId, status, totalCost) {
        this.orderId = orderId;
        this.status = status;
        this.totalCost = totalCost.toFixed(2);
    }
}

class Invoice {
    constructor(invoiceId, status, totalCost, dueDate) {
        this.invoiceId = invoiceId;
        this.status = status;
        this.totalCost = totalCost;
        this.dueDate = dueDate;
    }
}

function mapOrder(orderResult) {
    if (!orderResult || orderResult.length === 0) {
        return null;
    }

    const order = new Order(
        orderResult[0].ORDER_ID,
        orderResult[0].ORDER_STATUS,
        orderResult[0].CUSTOMER_ID,
        orderResult.reduce((total, row) => total + (row.PRICE * row.QUANTITY), 0),
        orderResult[0].DATE_CREATED
    );

    const items = orderResult.map(row => ({
        productId: row.PRODUCT_ID,
        quantity: row.QUANTITY,
        price: row.PRICE
    }));

    order.addItems(items);
    return order;
}

module.exports = { Order, Items, OrderResponse, Invoice, mapOrder };