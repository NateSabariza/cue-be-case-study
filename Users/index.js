const userDAO = require("../common/dao/userDAO");
const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/users", 
    async(req, res) => {
        req.context.log('Getting All Users');
        try {
            const users = await userDAO.getUsers();
            res.json(users);
        } catch {
            res.status(500).json({
                message: "Internal Server Error"
            });
        }
    }
);

module.exports = createHandler(app);