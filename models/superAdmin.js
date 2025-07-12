import mongoose from "mongoose";

const superAdminSchema = new mongoose.Schema(
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
    profile: {
      type: String,
    },
    role:{
      type: String,
      default: 'superadmin'
    }
  },
  {
    timestamps: true,
  }
);

const superAdminModel = new mongoose.model("superAdmin", superAdminSchema);
export default superAdminModel;
