import User from "../models/user.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });


    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, { // create JWT token in the stream 
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body; //user sends email & password

    if (!email || !password) { //if either not provided, send error
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email }); //find user in database by email
    if (!user) return res.status(401).json({ message: "Invalid email or password" }); //if user not found, send error

    const isPasswordCorrect = await user.matchPassword(password); //check if password matches the one in database
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" }); //if password doesn't match, send error

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { // create JWT token
      expiresIn: "7d",
    });

    res.cookie("jwt", token, { // set cookie with JWT token named jwt
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in miliseconds 
      httpOnly: true, // prevent XSS attacks,
      sameSite: "strict", // prevent CSRF attacks
      secure: process.env.NODE_ENV === "production", // use secure cookies in production (https)
    });

    res.status(200).json({ success: true, user }); // send success response with user data
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" }); 
  }
}

export function logout(req, res) {
  res.clearCookie("jwt"); //clear cookie named jwt
  res.status(200).json({ success: true, message: "Logout successful" }); // send success response
}
