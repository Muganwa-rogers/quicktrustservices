const express = require("express");
const db = require("../db");
const multer = require("multer");
const cloudinary = require("../cloudinaryConfig");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Fetch all apartments
router.get("/", (req, res) => {
    const sql = "SELECT * FROM apartments";
    // console.log("2");
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });
        res.json(results);
    });
});

// Fetch apartment by ID
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM apartments WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error", details: err });
        res.json(results[0]);
    });
});

// Add a new apartment
router.post("/add", upload.array("images", 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No images uploaded" });
        }

        const { title, location, priceDetails, description, amenities } = req.body;

        if (!title || !location || !priceDetails || !description || !amenities) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const imageUrls = await Promise.all(
            req.files.map(async (file) => {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: "apartments", format: "webp", transformation: [{ quality: "auto" }] },
                        (error, cloudinaryResult) => {
                            if (error) reject(error);
                            else resolve(cloudinaryResult);
                        }
                    ).end(file.buffer);
                });
                return result.secure_url;
            })
        );

        const imagesJson = JSON.stringify(imageUrls);

        const query = "INSERT INTO apartments (title, location, price_details, description, amenities, images) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [title, location, priceDetails, description, amenities, imagesJson];

        db.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to insert data" });
            res.json({ message: "Apartment added successfully", id: result.insertId, images: imageUrls });
        });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Update an apartment
router.put("/:id", upload.array("images", 5), async (req, res) => {
    const { id } = req.params;
    const { title, location, price_details, description, amenities } = req.body;
    // console.log(title,location,price_details,description, amenities);
    let imageUrls = [];
    if (req.files.length > 0) {
        imageUrls = await Promise.all(
            req.files.map(async (file) => {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: "apartments", format: "webp", transformation: [{ quality: "auto" }] },
                        (error, cloudinaryResult) => {
                            if (error) reject(error);
                            else resolve(cloudinaryResult);
                        }
                    ).end(file.buffer);
                });
                return result.secure_url;
            })
        );
    }

    const imagesJson = imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined;

    const query = imagesJson
        ? "UPDATE apartments SET title = ?, location = ?, price_details = ?, description = ?, amenities = ?, images = ? WHERE id = ?"
        : "UPDATE apartments SET title = ?, location = ?, price_details = ?, description = ?, amenities = ? WHERE id = ?";

    const values = imagesJson
        ? [title, location, price_details, description, amenities, imagesJson, id]
        : [title, location, price_details, description, amenities, id];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update apartment" });
        res.json({ message: "Apartment updated successfully" });
    });
});

// Delete an apartment
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM apartments WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete apartment" });
        res.json({ message: "Apartment deleted successfully" });
    });
});

module.exports = router;
