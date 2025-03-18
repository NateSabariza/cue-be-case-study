const { executeQuery, sql } = require("../config/db");
const userModel = require("../model/user");

module.exports = {
    async getUsers(){
        const query = `
            SELECT
                U.USER_ID userId,
                U.FIRSTNAME firstName,
                U.LASTNAME lastName,
                U.EMAIL email,
                C.CUSTOMER_ID customerId,
                C.NAME customerName,
                R.ROLE_ID roleId,
                R.NAME roleName
            FROM dbo.[USER] U
            LEFT JOIN dbo.[CUSTOMER_USER_MAP] CU ON U.USER_ID = CU.USER_ID
            LEFT JOIN dbo.[CUSTOMER] C ON C.CUSTOMER_ID = CU.CUSTOMER_ID
            LEFT JOIN dbo.[ROLE] R ON R.ROLE_ID = CU.ROLE_ID
        `
        const result = await executeQuery(query);
        const users = userModel.mapUsers(result);
        return users;
    },

    async createUser(user) {
        const query = `
            INSERT INTO dbo.[USER] (FIRSTNAME, LASTNAME, EMAIL)
            OUTPUT INSERTED.USER_ID
            VALUES (@FIRSTNAME, @LASTNAME, @EMAIL)
        `;

        const params = [
            { name: "FIRSTNAME", type: sql.NChar(10), value: user.FIRSTNAME },
            { name: "LASTNAME", type: sql.NChar(10), value: user.LASTNAME },
            { name: "EMAIL", type: sql.NChar(50), value: user.EMAIL }
        ];

        try {
            const result = await executeQuery(query, params);
            return result.recordset;
        } catch (error) {
            throw new Error("Error creating user: " + error.message);
        }
    }
}