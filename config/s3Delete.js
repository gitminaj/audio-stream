import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3Client.js";

export const deleteFromS3 = async (url) => {
  const extractS3Key = (url) => {
    if (!url) return null;
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname).slice(1); 
  };

  const key = extractS3Key(url);

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
    console.log(`Deleted from S3: ${key}`);
  } catch (error) {
    console.error("S3 Delete Error:", error);
  }
};