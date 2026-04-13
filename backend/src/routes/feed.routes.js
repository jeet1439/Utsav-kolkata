import express from "express";
import mongoose from "mongoose";
import Pandal from "../model/pandal.modal.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    let { page = 1, limit = 3 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const skip = (page - 1) * limit;
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const feed = await Pandal.aggregate([
      { $unwind: "$featuredPictures" },
      {
        $lookup: {
          from: "users",
          localField: "featuredPictures.userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $sort: {
          "featuredPictures.createdAt": -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: "$featuredPictures._id",
          url: "$featuredPictures.url",
          caption: "$featuredPictures.caption",
          likes: "$featuredPictures.likes",
          likesCount: { $size: { $ifNull: ["$featuredPictures.likes", []] } },
          isLiked: { $in: [userObjectId, { $ifNull: ["$featuredPictures.likes", []] }] },
          createdAt: "$featuredPictures.createdAt",
          pandalId: "$_id",
          pandalTitle: "$title",
          username: "$userDetails.username",
          profileImage: "$userDetails.profileImage",
          userId: "$featuredPictures.userId",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      page,
      count: feed.length,
      data: feed,
    });
  } catch (error) {
    console.error("Feed Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
    });
  }
});

export default router;
