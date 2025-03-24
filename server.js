const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
//Links fron the routes folder that contain all required

const construction = require("./Routes/construction");
const new_arrivals = require('./Routes/new_arrivals');
const rental_vehicles = require("./Routes/rental_vehicles");
const land_aquisition = require("./Routes/land_aquisition");
const security_solutions = require("./Routes/security_solutions");
const apartments = require("./Routes/apartments");
const admin = require("./Routes/admin");

const app = express();

app.use(express.urlencoded({ extended: true })); // Allow form-data
app.use(express.json()); // Allow JSON body


// Commennted codes below they are for future use

// API routes
// const isAdmin = (req, res, next) => {
//       if (req.session.user && req.session.user.role === 'admin') {
//             next();
//         } else {
//               res.status(403).json({ message: 'Access denied' });
//           }
//       };


app.use(cors());

//Routes for binding the front-end and the backend also used for testing

app.use("/api/construction", construction);
app.use("/api/new_arrivals", new_arrivals);
app.use("/api/rental_vehicles", rental_vehicles);
app.use("/api/land_aquisition", land_aquisition);
app.use("/api/security_solutions", security_solutions);
app.use("/api/apartments", apartments);
app.use('/admin',admin)
            
// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log('Connecting with:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        // port: process.env.DB_PORT,
    });
    
});
