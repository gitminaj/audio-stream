import AuthModel from "../models/auth.js";
import serverClient from "../config/stream.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OTPModel from "../models/otp.js";
import otpGenerator from "otp-generator"
import dotenv from "dotenv";
import { json } from "express";
dotenv.config();


export const register = async (req, res) => {
    try {
        const { name, email, password, dateOfBirth, gender, phone, otp } = req.body;
        if (!name || !email || !password || !gender || !phone || !dateOfBirth || !otp) {
            return res.status(400).json({
                message: "All fields are required",
            })
        }

        const profile = req.file;
        if (!profile) {
            return res.status(400).json({
                message: "Profile is required",
            })
        }
        const file = profile.path;

        const existingUser = await AuthModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists",
            })
        }

        const response = await OTPModel.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(response, "Response");

        if (response.length === 0) {
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        } else if (otp !== response[0].otp) {
            return res.status(400).json({
                success: false,
                message: "The OTP is not valid",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await AuthModel.create({
            name,
            email,
            password: hashedPassword,
            dateOfBirth,
            gender,
            phone,
            profile: file,
        })

        await serverClient.upsertUser({
            id: user._id.toString(),
            name: user.name,
            profile: `https://ui-avatars.com/api/?name=${user.name}`,
        });

        const streamToken = serverClient.createToken(user._id.toString());

        return res.status(201).json({
            success: false,
            message: "User registered successfully",
            data: user,
            streamToken
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}


export const login = async (req, res) => {
    try {

        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: `Please Fill up All the Required Fields`,
            })
        }

        const user = await AuthModel.findOne({ email })

        if (!user) {
            return res.status(401).json({
                success: false,
                message: `User is not Registered with Us Please SignUp to Continue`,
            })
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { email: user.email, id: user._id },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d",
                }
            )

            user.token = token
            user.password = undefined
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }

            const streamToken = serverClient.createToken(user._id.toString());

            res.cookie("token", token, options).status(200).json({
                success: true,
                message: `User Login Success`,
                user,
                token,
                streamToken,
            })
        } else {
            return res.status(401).json({
                success: false,
                message: `Password is incorrect`,
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Login Failure Please Try Again`,
        })
    }
}


export const sendOTP = async (req, res) => {
    try {

        const { email } = req.body;

        const checkUserPresent = await AuthModel.findOne({ email })

        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            })
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })
        const result = await OTPModel.findOne({ otp: otp })

        console.log("Result is Generate OTP Func")
        console.log("OTP", otp)
        console.log("Result", result)

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
            })
        }

        const otpPayload = { email, otp }
        const otpBody = await OTPModel.create(otpPayload)
        console.log("OTP Body", otpBody)
        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        })

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: message.error,
        });
    }
}


export const getUsers = async (req, res) => {
    try {
        const users = await AuthModel.find()
        if (!users) {
            return res.status(), json({
                success: false,
                message: "users not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: users
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}


export const getSingleUser = async (req, res) => {
    try {

        const { id } = req.params;
        const user = await AuthModel.findById(id)

        if (!user) {
            return res.status().json({
                success: false,
                message: "user not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: user
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        })
    }
}


export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await AuthModel.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await AuthModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
