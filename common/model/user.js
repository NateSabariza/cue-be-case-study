class Role {
    constructor(roleId, roleName) {
        this.roleId = roleId;
        this.roleName = roleName;
    }
}

class Customer {
    constructor(customerId, customerName, role) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.role = role;
    }
}

class User {
    constructor(userId, firstName, lastName, email) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.customers = [];
    }

    addCustomer(customer) {
        this.customers.push(customer);
    }
}

function mapUsers(rows) {
    const usersMap = new Map();

    rows.forEach(row => {
        if (!usersMap.has(row.userId)) {
            usersMap.set(row.userId, new User(row.userId, row.firstName, row.lastName, row.email));
        }

        if (row.customerId) {
            const user = usersMap.get(row.userId);
            const role = new Role(row.roleId, row.roleName);
            const customer = new Customer(row.customerId, row.customerName, role);
            user.addCustomer(customer);
        }
    });

    return Array.from(usersMap.values());
}

module.exports = { User, Customer, Role, mapUsers };