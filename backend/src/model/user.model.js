import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profileImage: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        default: ""
    },
    featuredImages: {
        type: [String], 
        default: []
    },
    location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], 
      default: [0, 0]
    }
  },
  lastActive: Date,
});
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

export default User;
