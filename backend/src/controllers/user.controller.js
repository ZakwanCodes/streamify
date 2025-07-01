// Import the User model from the models folder
import User from "../models/user.js";

// Import the FriendRequest model
import FriendRequest from "../models/FriendRequest.js";

// Controller to get recommended users (not yourself or your friends)
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id; // Get current user's ID from the request
    const currentUser = req.user; // Get the whole user object

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude the current user
        { _id: { $nin: currentUser.friends } }, // Exclude users who are already friends
        { isOnboarded: true }, // Only include users who have completed onboarding
      ],
    });

    // Send the list of recommended users
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Controller to get current user's friends
export async function getMyFriends(req, res) {
  try {
    // Find the user by ID, only select 'friends', then populate each friend with some details
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    // Send back the populated friends list
    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Controller to send a friend request
export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id; // Current user ID (sender)
    const { id: recipientId } = req.params; // Get recipient ID from the route parameter

    // Prevent sending request to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    // Check if the recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Check if already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // Check if a friend request already exists (both directions)
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    // Create new friend request document
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    // Return the newly created friend request
    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Controller to accept a friend request
export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params; // Get request ID from route parameter

    const friendRequest = await FriendRequest.findById(requestId); // Find the friend request

    // If the request doesn't exist
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Ensure the logged-in user is the one who received the request
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    // Mark the request as accepted and save it
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each user to the other's friends array (avoiding duplicates)
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Respond with success message
    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Controller to get incoming and accepted friend requests
export async function getFriendRequests(req, res) {
  try {
    // Find all incoming requests that are pending
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    // Find all accepted requests that the user sent
    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    // Return both lists
    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Controller to get all outgoing (sent) friend requests that are still pending
export async function getOutgoingFriendReqs(req, res) {
  try {
    // Find all friend requests sent by current user that are still pending
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    // Send back the result
    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
