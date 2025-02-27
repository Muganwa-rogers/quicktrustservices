const express = require("express");
const db = require("../db");
const multer = require("multer");
const cloudinary = require("../cloudinaryConfig");


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


//This is fetch section

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM land_aquisition';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }
        res.json(results);
        console.log(results);
    });
});


router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM land_aquisition WHERE id= ?';
  db.query(sql,id, (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Database error', details: err });
      }
      res.json(results);
  });
});



// Adding


router.post("/", upload.array("images", 4), async (req, res) => {
  try {
      // Ensure there are files uploaded
      if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: "No images uploaded" });
      }
      console.log("1");
      // Limit the number of files to 4
      if (req.files.length > 4) {
          return res.status(400).json({ error: "You can only upload up to 4 images" });
      }

      const { price_details, description, location,drop_off_info, title } = req.body;

      // Basic validation (for security purposes)
      if (!price_details || !description || !location || !title || !drop_off_info  ) {
          return res.status(400).json({ error: "Missing required fields" });
          console.log('error');
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
      const query = "INSERT INTO land_aquisition (land_title, price_details, location, land_description, image, drop_off_info) VALUES (?, ?, ?, ?, ?, ?)";
      const values = [title, price_details, location, description, imagesJson, drop_off_info];

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
//This is the update section

// the /:id that ges the id inside the link

router.put("/:id",upload.array("images", 4), async (req, res) => {

    const { id } = req.params;

    const { land_title , price_details, location, land_description, drop_off_info } = req.body;
    console.log(land_title,price_details,location,land_description,drop_off_info);
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
      const query = "UPDATE land_aquisition SET land_title = ?, price_details = ?, location = ? , land_description = ?,  drop_off_info =? WHERE id = ?";
      const values = [land_title, price_details, location, land_description, imagesJson, drop_off_info,  id];

  
      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Error updating land_aquistion_block", err);
          res.status(500).json({ error: "Failed to update land_aquistion_block" });
          return;
        }
        res.json({ message: "land_aquistion_block updated successfully" });
        console.log('land_aquistion_block updated succescfully')
      });
    }
    else{
      const query = "UPDATE land_aquisition SET land_title = ?, price_details = ?, location = ? , land_description = ?, image = ?, drop_off_info =? WHERE id = ?";
      const values = [land_title, price_details, location, land_description, imagesJson, drop_off_info,  id];

  
      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Error updating land_aquistion_block", err);
          res.status(500).json({ error: "Failed to update land_aquistion_block" });
          return;
        }
        res.json({ message: "land_aquistion_block updated successfully" });
        console.log('land_aquistion_block updated succescfully')
      });;
    }




  }
);

// This is the Delete section

// Delete a land_aquisition_block

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM land_aquisition WHERE id = ?";

    db.query(query, [id], (err, result) => {

      if (err) {

        console.error("Error deleting land_aquisition_block", err);
        res.status(500).json({ error: "Failed to delete land_aquisition_block" });
        return;
      }
      res.json({ message: "land_aquisition_block deleted successfully" });
      console.log('land_aquisition_block deleted succescfully')
    });
  });
   
   
module.exports = router;