import express from "express";
import cloudinary from "../lib/cloudConfig.js";
import User from "../model/user.model.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // store file in memory

router.post(
  "/featured-image",
  authMiddleware,
  upload.single("image"), // 'image' is the key in FormData
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      const uploadResponse = await cloudinary.uploader.upload_stream(
        { folder: "UtsavKolkata" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            return res.status(500).json({ message: "Cloud upload failed" });
          }

          const imageUrl = result.secure_url;

          const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { featuredImages: imageUrl } },
            { new: true }
          );

          res.status(201).json(updatedUser);
        }
      );

      // Send file buffer to cloudinary
      uploadResponse.end(req.file.buffer);

    } catch (error) {
      console.error("Error uploading featured image:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post("/update-bio", async (req, res) => {
  try {
    const { userId, bio } = req.body;

    if (!userId) return res.json({ success: false, message: "User ID required" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Bio updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/getuser/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;
