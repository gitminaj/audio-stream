import superAdmin from "../models/superAdmin.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(404).json({
        success: true,
        message: "name , email and password is required",
      });
    }

    const profile = req.file.location || null;

    const existUser = await superAdmin.findOne({ email });

    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "Super Admin already registered with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    const user = await superAdmin.create({
      name,
      email,
      password: hashedPassword,
      profile,
    });

    user.password = undefined;

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email or password missing",
      });
    }

    const user = await superAdmin.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `User is not Registered`,
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      user.token = token;
      user.password = undefined;
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        message: `User Login Success`,
        user,
        token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
