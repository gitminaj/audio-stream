import mongoose from "mongoose";

const AuthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    token: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    profile: {
      type: String,
      required: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    isPrivate: { 
        type: Boolean, 
        default: false 
    },
    followRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AuthModel = new mongoose.model("Auth", AuthSchema);
export default AuthModel;
