import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No or invalid Authorization header");
      return res.status(401).json({ message: "Unauthorized Access" });
    }

    const token = authHeader.split(" ")[1].trim();
    // console.log("Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SRC);
    // console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Invalid Token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Authentication error", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
