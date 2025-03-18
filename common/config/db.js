const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const connectionPool = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        return pool;
    })
    .catch(err => {
        throw(err);
    });

async function executeQuery(query, params = []) {
    try {
        const pool = await connectionPool;
        const request = pool.request();
        
        params.forEach(({ name, type, value }) => {
            request.input(name, type, value);
        });

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error("Database Query Error:", error); // Logs the error
        throw new Error("Database Error: " + error.message);
    }
}

module.exports = { executeQuery, sql };