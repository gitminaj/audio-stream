import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    postUrl: {
      type: String,
      required: true,
    },
    body: {
        type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      require: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users"
        }
    ]
  },
  {
    timestamps: true,
  }
);

const PostModel = new mongoose.model("Post", postSchema);
export default PostModel;
