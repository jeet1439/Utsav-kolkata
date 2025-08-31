import express from "express";
import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SRC, { expiresIn: "1d"});
}

router.post("/signup", async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        if(!username || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "password should be 6 charecter long"});
        }
        if(username.length < 3){
            return res.status(400).json({message: "Too short username"});
        }
    const exixtingUser = await User.findOne({email});
    if(exixtingUser){
        return res.status(400).json({message: "User already exists"});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const dicebearUrl = `https://res.cloudinary.com/dzwismxgx/image/upload/v1755195870/istockphoto-1495088043-612x612_riz8ns.jpg`;

    const user = new User({
        email,
        username,
        password: hashedPassword,
        profileImage: [dicebearUrl],
        bio: "",            
        featuredImages: []
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
        token,
        user:{
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        featuredImages: user.featuredImages
        },
    });

    } catch (error) {
        console.log("register route error", error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.post("/login", async (req, res) => {
    try {
    const { email, password } = req.body;
    if(!email || !password){
        return res.status(400).json({message: "All fields are required"});
    }
    const user = await User.findOne({email}); 
    
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!user || !isPasswordCorrect) {
       return res.status(401).json({ message: "Invalid credentials"});
    }
    const token = generateToken(user._id);

    res.status(201).json({
        token,
        user:{
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        featuredImages: user.featuredImages
        },
    });

    } catch (error) {
        console.log("Error in Login route", error);
        res.status(500).json({message: "Internall server Error"});
    }
});



export default router;