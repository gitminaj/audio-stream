import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3Client.js";

export const deleteFromS3 = async (url) => {
  const extractS3Key = (url) => {
    if (!url) return null;
    const pathname = new URL(url).pathname; // "/%201750418757300-1000281916.jpg%20%20%20"
    return decodeURIComponent(pathname).slice(1); // Remove leading "/" after decoding
  };

  const key = extractS3Key(url);
  console.log('key',key); // " 1750418757300-1000281916.jpg   "

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
