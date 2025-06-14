import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_HOST_USER,
                pass: process.env.EMAIL_HOST_PASSWORD,
            },
        });

        let info = await transporter.sendMail({
            from: "Audio Stream Application",
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });
        console.log("mail sender response", info);
        return info;
    } catch (error) {
        console.log(error.message);
    }
};