// models/Pandal.js
import mongoose from "mongoose";


const FeaturedPictureSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    caption: { type: String },
  },
  { timestamps: true }
);


const PandalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  about: {
    type: String,
    required: true,
    trim: true
  },
  pictures: [
    {
      type: String,
      required: true
    }
  ],
  nearestMetro: [
    {
      type: String,
      trim: true
    }
  ],
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], 
      required: true
    }
  },
  featuredPictures: [FeaturedPictureSchema],
}, {
  timestamps: true
});

PandalSchema.index({ location: "2dsphere" });

export default mongoose.model("Pandal", PandalSchema);
