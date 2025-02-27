const express = require("express");
const db = require("../db");
const multer = require("multer");
const cloudinary = require("../cloudinaryConfig");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory

// Fetch all rental vehicles
router.get("/", (req, res) => {
    const sql = "SELECT * FROM rental_vehicles";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });

        // Convert image column from JSON string to an array only if it's a valid JSON format
        const formattedResults = results.map(row => ({
            ...row,
            image: isJson(row.image) ? JSON.parse(row.image) : row.image // Only parse if it's valid JSON
        }));

        res.json(formattedResults);
    });
});

// Helper function to check if a string is valid JSON
const isJson = (str) => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

// Fetch by ID
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM rental_vehicles WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });
        if (results.length === 0) return res.status(404).json({ error: "Not found" });

        // Convert image JSON string back to an array
        results[0].image = JSON.parse(results[0].image);
        res.json(results[0]);
    });
});

// Add a new rental vehicle (Accepts multiple images)
router.post("/", upload.array("images", 4), async (req, res) => {
    try {
        // Ensure there are files uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No images uploaded" });
        }

        // Limit the number of files to 4
        if (req.files.length > 4) {
            return res.status(400).json({ error: "You can only upload up to 4 images" });
        }

        const { car_name, rental_details, features, drop_off_info } = req.body;

        // Basic validation (for security purposes)
        if (!car_name || !rental_details || !features || !drop_off_info) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upload all images to Cloudinary and store their URLs
        const imageUrls = [];
        for (const file of req.files) {
            try {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: "uploads", format: "webp", transformation: [{ quality: "auto" }] },
                        (error, cloudinaryResult) => {
                            if (error) reject(error);
                            else resolve(cloudinaryResult);
                        }
                    ).end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
                return res.status(500).json({ error: "Image upload failed" });
            }
        }

        // Convert imageUrls array to JSON string
        const imagesJson = JSON.stringify(imageUrls);

        // Insert into the database
        const query = "INSERT INTO rental_vehicles (car_name, rental_details, features, image, drop_off_info) VALUES (?, ?, ?, ?, ?)";
        const values = [car_name, rental_details, features, imagesJson, drop_off_info];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).json({ error: "Failed to insert data into the database" });
            }
            res.json({ message: "Rental vehicle added successfully", id: result.insertId, images: imageUrls });
        });

    } catch (error) {
        console.error("Error processing the request:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});



// Update a rental vehicle
router.put("/:id", upload.array("images", 4), async (req, res) => {
    try {
        const { id } = req.params;
        const { car_name, rental_details, features, drop_off_info } = req.body;

        let imageUrls = [];
        if (req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: "uploads", format: "webp", transformation: [{ quality: "auto" }] },
                        (error, cloudinaryResult) => {
                            if (error) reject(error);
                            else resolve(cloudinaryResult);
                        }
                    ).end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            }
        }

        const imagesJson = imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined;
        if(imagesJson != ''){
            const query = "UPDATE rental_vehicles SET car_name = ?, rental_details = ?, features = ?, drop_off_info = ? WHERE id = ?";
            const values = [car_name, rental_details, features, drop_off_info, id];
    
            db.query(query, values, (err, result) => {
              if (err) {
                console.error("Error updating construction block:", err);
                res.status(500).json({ error: "Failed to update construction block" });
                return;
              }
              res.json({ message: "construction block updated successfully" });
              console.log('construction blockupdated succescfully')
            });
          }
          else{
            const query = "UPDATE rental_vehicles SET car_name = ?, rental_details = ?, features = ?, image = ?, drop_off_info = ? WHERE id = ?";
            const values = [car_name, rental_details, features, imagesJson, drop_off_info, id];
    
            db.query(query, values, (err, result) => {
              if (err) {
                console.error("Error updating construction block:", err);
                res.status(500).json({ error: "Failed to update construction block" });
                return;
              }
              res.json({ message: "construction block updated successfully" });
              console.log('construction blockupdated succescfully')
            });
          }
        const query = "UPDATE rental_vehicles SET car_name = ?, rental_details = ?, features = ?, image = ?, drop_off_info = ? WHERE id = ?";
        const values = [car_name, rental_details, features, imagesJson, drop_off_info, id];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error updating rental_vehicle:", err);
                return res.status(500).json({ error: "Failed to update rental_vehicle" });
            }
            res.json({ message: "Rental vehicle updated successfully"});
        });

    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Delete a rental vehicle
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM rental_vehicles WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error deleting rental_vehicle:", err);
            return res.status(500).json({ error: "Failed to delete rental_vehicle" });
        }
        res.json({ message: "Rental vehicle deleted successfully" });
    });
});

module.exports = router;
