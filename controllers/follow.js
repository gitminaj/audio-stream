import FollowModel from "../models/follow.js";
import AuthModel  from "../models/auth.js"

// Follow a user
export const followUser = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        if (followerId === followingId) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        const existingFollow = await FollowModel.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: "You already follow this user"
            });
        }

        const follow = await FollowModel.create({ followerId, followingId });

        res.status(201).json({
            success: true,
            message: "Followed user successfully",
            data: follow
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        const unfollow = await FollowModel.findOneAndDelete({ followerId, followingId });

        if (!unfollow) {
            return res.status(404).json({
                success: false,
                message: "Follow relationship not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Unfollowed user successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get followers of a user
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;

        const followers = await FollowModel.find({ followingId: userId }).populate('followerId');

        res.status(200).json({
            success: true,
            data: followers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Get following of a user
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;

        const following = await FollowModel.find({ followerId: userId }).populate('followingId');

        res.status(200).json({
            success: true,
            data: following
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

export const getDiscoverUsers = async (req, res) => {
    try {
      const currentUserId = req.params.userId;
  
      const followingDocs = await FollowModel.find({ followerId: currentUserId });
      const followingIds = followingDocs.map(f => f.followingId.toString());
  
      const usersToShow = await AuthModel.find({
        _id: { $nin: [...followingIds, currentUserId] }
      }).select("name profile");
  
      res.status(200).json(usersToShow);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch discover users" });
    }
  };
