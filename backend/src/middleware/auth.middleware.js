import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // access the JWT from cookies

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" }); // if no token send error
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); //decode the JWT using the secret key

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" }); //invalid token 
    }

    const user = await User.findById(decoded.userId).select("-password"); // find user by ID from the decoded token and exclude password field 

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user; // attach user to request object for further use in route handles 
 
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};