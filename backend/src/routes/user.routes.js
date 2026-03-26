import express from "express";
import cloudinary from "../lib/cloudConfig.js";
import User from "../model/user.model.js";
import mongoose from "mongoose";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";
import redis from '../redis/redis.js'
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

router.post("/follow/:id", authMiddleware, async (req, res) => {
  try {

    const userId = req.user._id;
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.followings.includes(targetUserId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.followings.push(targetUserId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    res.json({ success: true, message: "User followed" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/unfollow/:id", authMiddleware, async (req, res) => {
  try {

    const userId = req.user._id;
    const targetUserId = req.params.id;

    await User.findByIdAndUpdate(userId, {
      $pull: { followings: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: userId }
    });

    res.json({ success: true, message: "User unfollowed" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/followers/:id", async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .populate("followers", "username profileImage bio");

    res.json(user.followers);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/following/:id", async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
      .populate("following", "username profileImage bio");

    res.json(user.followings);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/is-following/:id", authMiddleware, async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    const isFollowing = user.followings.includes(req.params.id);

    res.json({ isFollowing });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/update-location", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    await User.findByIdAndUpdate(userId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      lastActive: new Date(),
    });

    res.json({ message: "Location updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// router.post("/nearby-online", async (req, res) => {
//   try {
//     const { userId, latitude, longitude } = req.body;

//     const nearbyUsers = await User.find({
//       _id: { $ne: userId },
//       location: {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: 5000,
//         },
//       },
//     }).limit(50);

//     const usersWithOnline = await Promise.all(
//       nearbyUsers.map(async (user) => {
//         const isOnline = await redis.get(`online:${user._id}`);
//         console.log(isOnline)
//         return {
//           _id: user._id,
//           name: user.username,
//           avatar: user.profileImage[0],
//           isOnline: isOnline === "true",
//           bio: user.bio,
//           distance: 1, 
//         };
//       })
//     );

//     res.json(usersWithOnline);
//   } catch (error) {
//     console.error("Nearby error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

router.post("/nearby-online", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance", 
          maxDistance: 5000,
          spherical: true,
          query: {
            _id: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
      },
      { $limit: 50 },
    ]);

    const usersWithOnline = await Promise.all(
      nearbyUsers.map(async (user) => {
        const isOnline = await redis.get(`online:${user._id}`);

        return {
          _id: user._id,
          name: user.username,
          avatar: user.profileImage[0],
          bio: user.bio,
          isOnline: isOnline === "true",
          distance: (user.distance / 1000).toFixed(2), // convert meters to km
        };
      })
    );

    res.json(usersWithOnline);
  } catch (error) {
    console.error("Nearby error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;