const userDAO = require("../common/dao/userDAO");
const createHandler = require("azure-function-express").createHandler;
const express = require("express");
const app = express();

app.get("/api/user", 
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

app.post("/api/user", async (req, res) => {
    console.log("Received request to create a user");

    const { FIRSTNAME, LASTNAME, EMAIL } = req.body;
    if (!FIRSTNAME || !LASTNAME || !EMAIL) {
        console.log("Validation failed: Missing fields");
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        console.log("Calling userDAO.createUser...");
        const userId = await userDAO.createUser({ FIRSTNAME, LASTNAME, EMAIL });
        console.log("User created with ID:", userId);
        
        res.status(201).json({ USER_ID: userId });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = createHandler(app);