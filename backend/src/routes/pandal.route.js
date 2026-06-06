// routes/pandalRoutes.js
import express from "express";
import Pandal from "../model/pandal.modal.js";
import User from "../model/user.model.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";
import cloudinary from "../lib/cloudConfig.js";
import admin from "../lib/firebase.js";
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });


function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

const COMMENT_USER_FIELDS = "username profileImage";

const getUserId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value._id || value.id || value;
};

const serializeComment = (comment, currentUserId) => {
  const raw = comment.toObject ? comment.toObject() : comment;
  const ownerId = getUserId(raw.userId);

  return {
    ...raw,
    isOwner: ownerId?.toString() === currentUserId.toString(),
  };
};

router.get("/nearest", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and Longitude are required" });
    }

    const allPandals = await Pandal.find({});
    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Calculate distance for each pandal
    const pandalsWithDistance = allPandals.map(pandal => {
      const [lon, lat] = pandal.location.coordinates;
      const distance = getDistance(userLat, userLon, lat, lon);
      return { ...pandal._doc, distance };
    });


    const nearestPandals = pandalsWithDistance
      .filter(p => p.distance <= 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    res.status(200).json(nearestPandals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/:pandalId/featured-image", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { pandalId } = req.params;
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "UtsavKolkata" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ message: "Cloud upload failed" });
        }

        const imageUrl = result.secure_url;

        const updatedPandal = await Pandal.findByIdAndUpdate(
          pandalId,
          {
            $push: {
              featuredPictures: {
                $each: [
                  {
                    url: imageUrl,
                    userId: req.user._id,
                    caption: caption || "",
                  }
                ],
                $position: 0
              }
            },
          },
          { new: true }
        ).populate("featuredPictures.userId", "username profileImage");

        res.status(201).json(updatedPandal);
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading featured image:", error);
    res.status(500).json({ message: "Server error" });
  }
}
);

// ── Toggle like on a featured picture ────────────────────────────────────────
router.post("/:pandalId/featured/:pictureId/like", authMiddleware, async (req, res) => {
  try {
    const { pandalId, pictureId } = req.params;
    const userId = req.user._id;

    const pandal = await Pandal.findById(pandalId);
    if (!pandal) return res.status(404).json({ message: "Pandal not found" });

    const picture = pandal.featuredPictures.id(pictureId);
    if (!picture) return res.status(404).json({ message: "Picture not found" });

    const alreadyLiked = picture.likes.includes(userId);

    if (alreadyLiked) {
      picture.likes.pull(userId);
    } else {
      picture.likes.addToSet(userId);
    }

    await pandal.save();

    if (!alreadyLiked && picture.userId.toString() !== userId.toString()) {
      try {
        const liker = await User.findById(userId).select("username");
        const imageOwner = await User.findById(picture.userId).select("fcmToken username");
        // console.log(imageOwner?.fcmToken);
        if (imageOwner?.fcmToken) {
          await admin.messaging().send({
            token: imageOwner.fcmToken,
            notification: {
              title: "Hey!",
              body: `${liker?.username || "Someone"} liked your photo at ${pandal.title}`,
            },
            android: {
              notification: {
                icon: "ic_notification",
                color: "#FF4D6D",
                channel_id: "default_channel",
              },
            },
            data: {
              type: "like",
              pandalId: pandalId,
              pictureId: pictureId,
            },
          });
        }
      } catch (notifError) {
        console.error("Like notification error:", notifError.message);
      }
    }

    res.status(200).json({
      liked: !alreadyLiked,
      likesCount: picture.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:pandalId/featured/:pictureId/comments", authMiddleware, async (req, res) => {
  try {
    const { pandalId, pictureId } = req.params;
    const userId = req.user._id;

    const pandal = await Pandal.findById(pandalId).populate({
      path: "featuredPictures.comments.userId",
      select: COMMENT_USER_FIELDS,
    });
    if (!pandal) return res.status(404).json({ message: "Pandal not found" });

    const picture = pandal.featuredPictures.id(pictureId);
    if (!picture) return res.status(404).json({ message: "Picture not found" });

    const comments = (picture.comments || []).map((comment) =>
      serializeComment(comment, userId)
    );

    res.status(200).json({
      success: true,
      comments,
      commentsCount: comments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:pandalId/featured/:pictureId/comments", authMiddleware, async (req, res) => {
  try {
    const { pandalId, pictureId } = req.params;
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: "Comment must be 500 characters or less" });
    }

    const pandal = await Pandal.findById(pandalId);
    if (!pandal) return res.status(404).json({ message: "Pandal not found" });

    const picture = pandal.featuredPictures.id(pictureId);
    if (!picture) return res.status(404).json({ message: "Picture not found" });

    picture.comments.push({
      userId: req.user._id,
      text,
    });

    const commentId = picture.comments[picture.comments.length - 1]._id;
    await pandal.save();
    await pandal.populate({
      path: "featuredPictures.comments.userId",
      select: COMMENT_USER_FIELDS,
    });

    const updatedPicture = pandal.featuredPictures.id(pictureId);
    const comment = updatedPicture.comments.id(commentId);

    res.status(201).json({
      success: true,
      comment: serializeComment(comment, req.user._id),
      commentsCount: updatedPicture.comments.length,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:pandalId/featured/:pictureId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const { pandalId, pictureId, commentId } = req.params;
    const userId = req.user._id.toString();

    const pandal = await Pandal.findById(pandalId);
    if (!pandal) return res.status(404).json({ message: "Pandal not found" });

    const picture = pandal.featuredPictures.id(pictureId);
    if (!picture) return res.status(404).json({ message: "Picture not found" });

    const comment = picture.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const commentOwnerId = getUserId(comment.userId)?.toString();
    const memoryOwnerId = getUserId(picture.userId)?.toString();
    const canDelete = commentOwnerId === userId || memoryOwnerId === userId;

    if (!canDelete) {
      return res.status(403).json({ message: "You cannot delete this comment" });
    }

    picture.comments.pull(comment._id);
    await pandal.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      commentsCount: picture.comments.length,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:pandalId/featured/:pictureId", authMiddleware, async (req, res) => {
  try {
    const { pandalId, pictureId } = req.params;
    const userId = req.user._id.toString();

    const pandal = await Pandal.findById(pandalId);
    if (!pandal) return res.status(404).json({ message: "Pandal not found" });

    const picture = pandal.featuredPictures.id(pictureId);
    if (!picture) return res.status(404).json({ message: "Picture not found" });

    if (picture.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own memory" });
    }

    pandal.featuredPictures.pull(picture._id);
    await pandal.save();

    res.status(200).json({ success: true, message: "Memory deleted successfully" });
  } catch (error) {
    console.error("Error deleting featured image:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, about, pictures, latitude, longitude, nearestMetro } = req.body;

    if (!title || !about || !pictures || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPandal = new Pandal({
      title,
      about,
      pictures,
      nearestMetro,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });

    await newPandal.save();
    res.status(201).json({ message: "Pandal added successfully", pandal: newPandal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const pandal = await Pandal.findById(req.params.id)
      .populate("featuredPictures.userId", "username profileImage");

    if (!pandal) {
      return res.status(404).json({ message: "Pandal not found" });
    }

    const userId = req.user._id.toString();
    const pandalObj = pandal.toObject();
    pandalObj.featuredPictures = pandalObj.featuredPictures.map((pic) => ({
      ...pic,
      likesCount: pic.likes ? pic.likes.length : 0,
      commentsCount: pic.comments ? pic.comments.length : 0,
      isLiked: pic.likes ? pic.likes.some((id) => id.toString() === userId) : false,
      isOwner: (pic.userId?._id || pic.userId)?.toString() === userId,
    }));

    res.status(200).json(pandalObj);
  } catch (error) {
    console.error("Error fetching pandal:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
