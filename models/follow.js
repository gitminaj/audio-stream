import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema({

    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    },
    followingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    }
}, {
    timestamps: true

})


const FollowModel = new mongoose.model("Follow", FollowSchema)
export default FollowModel