import dotenv from "dotenv";
import multer from "multer";
import multerS3 from "multer-s3";

import s3 from "./s3Client.js";

dotenv.config();

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      let folder = null;

      if (file.fieldname === "profile") folder = "users/profile-pictures";

      const filename = `${Date.now()}-${file.originalname}`;
      cb(null, ` ${folder ? `${folder}/${filename}` : `${filename}`}   `);
    },
  }),
});
