const express = require("express");
const cloudinary = require("../cloudinaryConfig");
const router = express.Router();
const multer = require("multer");
const db = require("../db");

// Configure Multer to store files in memory (not disk!)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fetch all new arrivals
router.get("/", (req, res) => {
    const sql = "SELECT * FROM new_arrivals";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});
// Fetch new arrival by ID
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM new_arrivals WHERE block_id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});


router.put("/:id", upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
    }

    try {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "uploads", format: "webp", transformation: [{ quality: "auto" }] },
                (error, cloudinaryResult) => {
                    if (error) reject(error);
                    else resolve(cloudinaryResult);
                }
            );
            stream.end(req.file.buffer);
        });

        const imageUrl = result.secure_url;

        let query = "UPDATE new_arrivals SET block_title = ?, block_description = ?, block_image = ? WHERE block_id = ?";
        let values = [title, description, imageUrl, id];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error updating new arrival:", err);
                return res.status(500).json({ error: "Failed to update new arrival" });
            }
            res.json({ message: "New arrival updated successfully", imageUrl });
        });

    } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({ error: "Image upload failed" });
    }
});

module.exports = router;
