const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const util = require("util");

const query = util.promisify(db.query).bind(db); // Promisify the query method

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Query the "admin" table for a record matching the provided email
    const rows = await query("SELECT * FROM admin WHERE email = ?", [email]);
    
    // If no admin is found, send an error
    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    
    // Assuming the admin table has fields: id, email, and password (stored as plain texts)
    const user = rows[0];
    
    // Compare the provided password with the stored password
    if (password !== user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // Generate a token that expires in 7 days
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
