import FollowModel from "../models/follow.js";
import AuthModel from "../models/auth.js";


export const followUser = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const existUser = await AuthModel.findById(followingId);
    
    if (!existUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const existingFollow = await FollowModel.findOne({
      followerId,
      followingId,
    });
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "You already follow this user",
      });
    }

    // if private then request else follow

    if (existUser.isPrivate) {
      const existRequest = existUser.followRequests.includes(followerId);
      if (existRequest) {
        return res.status(400).json({
          success: false,
          message: "follow request already sent",
        });
      }
      existUser.followRequests.push(followerId);
      await existUser.save();

      return res.status(200).json({ message: "Follow request sent" });
    } else {
      const follow = await FollowModel.create({ followerId, followingId });

      res.status(201).json({
        success: true,
        message: "Followed user successfully",
        data: follow,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const acceptFollowRequest = async (req, res) => {
  const { requesterId } = req.body;
  const userId = req?.user?.id

  try {
    const user = await AuthModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.followRequests.indexOf(requesterId);
    console.log('index',index)
    if (index === -1) return res.status(400).json({ message: "No such request" });

    user.followRequests.splice(index, 1);
    await user.save();

    const follow = new FollowModel({ followerId: requesterId, followingId: userId });
    await follow.save();

    return res.status(200).json({ message: "Follow request accepted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFollowRequests = async (req, res) => {
  const  {userId}  = req.params;

  try {
    const user = await AuthModel.findById(userId)
      .populate('followRequests', 'name email profile');

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, data: user.followRequests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



export const unfollowUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    const unfollow = await FollowModel.findOneAndDelete({
      followerId,
      followingId,
    });

    if (!unfollow) {
      return res.status(404).json({
        success: false,
        message: "Follow relationship not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unfollowed user successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const followers = await FollowModel.find({ followingId: userId }).populate(
      "followerId"
    );

    res.status(200).json({
      success: true,
      data: followers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const following = await FollowModel.find({ followerId: userId }).populate(
      "followingId"
    );

    res.status(200).json({
      success: true,
      data: following,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getDiscoverUsers = async (req, res) => {
  try {
    const currentUserId = req.params.userId;

    const followingDocs = await FollowModel.find({ followerId: currentUserId });
    const followingIds = followingDocs.map((f) => f.followingId.toString());

    const usersToShow = await AuthModel.find({
      _id: { $nin: [...followingIds, currentUserId] },
    }).select("-password");

    res.status(200).json(usersToShow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch discover users" });
  }
};
