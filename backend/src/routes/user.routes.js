import express from "express";
import cloudinary from "../lib/cloudConfig.js";
import User from "../model/user.model.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

router.post(
  "/profile-image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image is required" });
      }

      const result = await uploadToCloudinary(req.file.buffer, "UtsavKolkata/profiles");

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: [result.secure_url] },   // replace — one profile photo
        { new: true }
      ).select("-password");

      res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ─── POST /featured-image ─────────────────────────────────────────────────────
router.post(
  "/featured-image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image is required" });
      }

      const result = await uploadToCloudinary(req.file.buffer, "UtsavKolkata/featured");

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $push: { featuredImages: result.secure_url } },
        { new: true }
      ).select("-password");

      res.status(201).json(updatedUser);
    } catch (error) {
      console.error("Error uploading featured image:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ─── POST /update-bio ─────────────────────────────────────────────────────────
router.post("/update-bio", async (req, res) => {
  try {
    const { userId, bio } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "User ID required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio },
      { new: true }
    ).select("-password");

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