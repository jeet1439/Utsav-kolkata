import express from "express";
import cloudinary from "../lib/cloudConfig.js";
import User from "../model/user.model.js";
import mongoose from "mongoose";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";
import redis from '../redis/redis.js'
import { ONLINE_USERS_SET, onlineUserKey } from "../constants/presence.js";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const NEARBY_RADIUS_METERS = 25000;
const NEARBY_LIMIT = 50;

const parseCoordinate = (value) => {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
};

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

router.post("/offline", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user._id);

    await redis.multi().del(onlineUserKey(userId)).srem(ONLINE_USERS_SET, userId).exec();

    res.json({ success: true, message: "User marked offline" });
  } catch (error) {
    console.error("Offline status error:", error);
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
    const latitudeNumber = parseCoordinate(latitude);
    const longitudeNumber = parseCoordinate(longitude);

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      latitudeNumber === null ||
      longitudeNumber === null ||
      latitudeNumber < -90 ||
      latitudeNumber > 90 ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return res.status(400).json({ error: "Valid userId, latitude, and longitude are required" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      location: {
        type: "Point",
        coordinates: [longitudeNumber, latitudeNumber],
      },
      lastActive: new Date(),
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Location updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/nearby-online", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    const latitudeNumber = parseCoordinate(latitude);
    const longitudeNumber = parseCoordinate(longitude);

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      latitudeNumber === null ||
      longitudeNumber === null ||
      latitudeNumber < -90 ||
      latitudeNumber > 90 ||
      longitudeNumber < -180 ||
      longitudeNumber > 180
    ) {
      return res.status(400).json({ error: "Valid userId, latitude, and longitude are required" });
    }

    const onlineUserIds = await redis.smembers(ONLINE_USERS_SET);
    const validOnlineUserIds = onlineUserIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const onlineStatuses = validOnlineUserIds.length
      ? await redis.mget(...validOnlineUserIds.map((id) => onlineUserKey(id)))
      : [];
    const activeOnlineUserIds = validOnlineUserIds.filter((id, index) => onlineStatuses[index] === "true");
    const staleOnlineUserIds = validOnlineUserIds.filter((id, index) => onlineStatuses[index] !== "true");

    if (staleOnlineUserIds.length) {
      await redis.srem(ONLINE_USERS_SET, ...staleOnlineUserIds);
    }

    const currentUserId = new mongoose.Types.ObjectId(userId);
    const activeOnlineObjectIds = activeOnlineUserIds
      .filter((id) => id !== userId)
      .map((id) => new mongoose.Types.ObjectId(id));

    if (!activeOnlineObjectIds.length) {
      return res.json([]);
    }

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitudeNumber, latitudeNumber],
          },
          distanceField: "distance", 
          maxDistance: NEARBY_RADIUS_METERS,
          spherical: true,
          query: {
            _id: { $in: activeOnlineObjectIds, $ne: currentUserId },
          },
        },
      },
      { $limit: NEARBY_LIMIT },
    ]);

    const usersWithOnline = nearbyUsers.map((user) => ({
      _id: user._id,
      name: user.username,
      avatar: user.profileImage[0],
      bio: user.bio,
      isOnline: true,
      distance: Number((user.distance / 1000).toFixed(2)),
    }));

    res.json(usersWithOnline);
  } catch (error) {
    console.error("Nearby error:", error);
    res.status(500).json({ error: error.message });
  }
});

//route to update the fcm token of the user
router.post("/update-fcm-token", async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update FCM token error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
