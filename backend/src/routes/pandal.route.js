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
      isLiked: pic.likes ? pic.likes.some((id) => id.toString() === userId) : false,
    }));

    res.status(200).json(pandalObj);
  } catch (error) {
    console.error("Error fetching pandal:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
