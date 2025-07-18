// import { truncates } from "bcryptjs";
// import PostModel from "../models/post.js";

import PostModel from "../models/post.js";
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { pipeline } from "stream";
import { promisify } from "util";
// import { isVideoFile, getFilterMatrixById, processVideoWithFilters } from "../utils/videoUtils.js";

const pipe = promisify(pipeline);
const s3 = new S3Client({ region: "ap-south-1" }); // update if needed

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

export const VIDEO_FILTER_MATRICES = [
  {
    id: 'normal',
    name: 'Normal',
    icon: 'circle',
    matrix: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
   {
    id: 'cairo',
    name: 'Cairo',
    icon: 'layers',
    matrix: [
      1.1, 0.15, 0.0, 0, 0.05,
      0.1, 1.0, 0.0, 0, 0.03,
      -0.1, -0.05, 0.8, 0, 0.01,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    icon: 'aperture',
    matrix: [
      0.9, 0.2, 0.0, 0, -0.04,
      0.0, 1.1, 0.3, 0, 0.02,
      0.2, 0.0, 1.3, 0, 0.06,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'cinematic',
    name: 'Cinema',
    icon: 'film',
    matrix: [
      1.2, -0.05, -0.1, 0, 0,
      -0.1, 1.1, -0.1, 0, 0,
      -0.05, 0.05, 1.3, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },

  {
    id: 'grayscale',
    name: 'Graphite',
    icon: 'moon',
    matrix: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
  id: 'retro_vhs',
  name: 'Retro VHS',
  icon: 'rotate-ccw',
  matrix: [
    1.1, 0.3, -0.2, 0, 0.1,   // Red bleed
    -0.1, 0.9, 0.4, 0, -0.05,  // Green noise
    0.2, -0.1, 0.8, 0, 0.15,   // Blue haze
    0, 0, 0, 1, 0,
  ],
},
  {
    id: 'cool',
    name: 'Cool',
    icon: 'wind',
    matrix: [
      0.8, 0, 0.2, 0, 0,
      0, 0.9, 0.1, 0, 0,
      0, 0, 1.2, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
   {
    id: 'juno',
    name: 'Juno',
    icon: 'sunrise',
    matrix: [
      1.1, 0.0, 0.0, 0, 0.0196,
      0.0, 1.0, 0.0, 0, 0,
      0.0, 0.0, 0.9, 0, -0.0392,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'dramatic',
    name: 'Drama',
    icon: 'zap',
    matrix: [
      1.5, 0, 0, 0, 0,
      0, 1.5, 0, 0, 0,
      0, 0, 1.5, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
   {
    id: 'jaipur',
    name: 'Jaipur',
    icon: 'loader',
    matrix: [
      1.3, -0.1, 0.2, 0, 0.06,
      0.1, 0.9, 0.1, 0, 0.04,
      0.0, 0.2, 0.85, 0, 0.02,
      0, 0, 0, 1, 0,
    ],
  },
    {
    id: 'soft',
    name: 'Soft',
    icon: 'feather',
    matrix: [
      0.95, 0.05, 0.05, 0, 0.01176,
      0.05, 0.95, 0.05, 0, 0.01176,
      0.05, 0.05, 0.95, 0, 0.01176,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'tealOrange',
    name: 'Teal & Orange',
    icon: 'target',
    matrix: [
      1.2, -0.1, -0.1, 0, 0,
      -0.05,1.05, -0.1, 0, 0,
      -0.2, 0.2,  1.0, 0, 0.02,
      0,    0,    0,   1, 0,
    ],
  },
  {
  id: 'arctic_frost',
  name: 'Arctic Frost',
  icon: 'cloud-snow',
  matrix: [
    0.7, 0.2, 0.4, 0, 0.3,    // Ice blue tint
    0.1, 0.8, 0.3, 0, 0.25,   // Cyan highlights
    0.5, 0.3, 1.2, 0, 0.4,     // Frostburn whites
    0, 0, 0, 1, 0,
  ],
},
  {
    id: 'moody',
    name: 'Moody',
    icon: 'cloud',
    matrix: [
      1.1, 0,   0,   0, -0.0196,
      0,   1.1, 0,   0, -0.0196,
      0,   0,   1.1, 0, -0.0196,
      0,   0,   0,   1, 0,
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    icon: 'droplet',
    matrix: [
      1.05, 0,    0,    0, 0.0235,
      0,    1.02, 0,    0, 0.0235,
      0,    0,    1.0,  0, 0.0235,
      0,    0,    0,    1, 0,
    ],
  },
  {
    id: 'matte',
    name: 'Matte',
    icon: 'square',
    matrix: [
      0.8, 0,   0,   0, 0.0784,
      0,   0.8, 0,   0, 0.0784,
      0,   0,   0.8, 0, 0.0784,
      0,   0,   0,   1, 0,
    ],
  },
  {
    id: 'fade',
    name: 'Fade',
    icon: 'trending-down',
    matrix: [
      0.9, 0.05, 0.05, 0, 0,
      0.05, 0.9, 0.05, 0, 0,
      0.05, 0.05, 0.9, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    icon: 'command',
    matrix: [
      1.2, 0.0, 0.0, 0, -0.0392,
      0.0, 1.1, 0.0, 0, -0.0196,
      0.0, 0.0, 1.0, 0, 0.0196,
      0, 0, 0, 1, 0,
    ],
  },
    {
    id: 'warm',
    name: 'Warm',
    icon: 'thermometer',
    matrix:[
      1.2, 0,   0,   0, 0.1,
      0,   1.0, 0,   0, 0.05,
      0,   0,   0.8, 0, 0,
      0,   0,   0,   1, 0
    ],
  },
  {
    id: 'gingham',
    name: 'Gingham',
    icon: 'grid',
    matrix: [
      0.9, 0.0, 0.0, 0, 0.0392,
      0.0, 0.95, 0.0, 0, 0.0196,
      0.0, 0.0, 0.85, 0, 0.0196,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'moon',
    name: 'Moon',
    icon: 'moon',
    matrix: [
      0.8, 0.0, 0.0, 0, 0.0784,
      0.0, 0.8, 0.2, 0, 0.0392,
      0.0, 0.1, 0.9, 0, 0.0784,
      0, 0, 0, 1, 0,
    ],
  },
 
  {
    id: 'buenos_aires',
    name: 'Buenos',
    icon: 'globe',
    matrix: [
      1.15, 0.05, -0.05, 0, 0.03,
      0.05, 1.05, 0.0, 0, 0.02,
      -0.1, 0.0, 0.95, 0, -0.01,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: 'camera',
    matrix: [
      0.6, 0.3, 0.1, 0, 0,
      0.2, 0.7, 0.1, 0, 0,
      0.1, 0.2, 0.7, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: 'sun',
    matrix: [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
  id: 'cyber_hologram',
  name: 'Hologram',
  icon: 'video',
  matrix: [
    0.4, 1.2, 0.0, 0, -0.1,   // Cyan channel overload
    1.1, 0.3, 0.9, 0, 0.15,   // Magenta interference
    0.0, 0.8, 0.5, 0, 0.2,    // Green scanlines
    0, 0, 0, 1, 0,
  ],
},
   {
    id: 'inverted',
    name: 'Inverted',
    icon: 'refresh-ccw',
    matrix: [
      -1, 0, 0, 0, 1,
       0, -1, 0, 0, 1,
       0, 0, -1, 0, 1,
       0, 0, 0, 1, 0,
    ],
  },
  {
    id: 'new_york',
    name: 'New York',
    icon: 'map-pin',
    matrix: [
      1.2, 0.0, 0.1, 0, -0.05,
      0.0, 0.95, 0.0, 0, -0.03,
      0.1, 0.0, 1.1, 0, 0.04,
      0, 0, 0, 1, 0,
    ],
  },
];

// Fixed function to convert matrix to FFmpeg filter
function convertMatrixToFFmpegFilter(matrix) {
  if (!matrix || matrix.length !== 20) {
    return null;
  }
  
  // Extract values from 5x4 matrix format
  const [rr, rg, rb, ra, rBias,
         gr, gg, gb, ga, gBias, 
         br, bg, bb, ba, bBias,
         ar, ag, ab, aa, aBias] = matrix;

  // FFmpeg colorchannelmixer doesn't support bias directly
  // We need to use a combination of colorchannelmixer and curves/levels
  let filterString = `colorchannelmixer=rr=${rr}:rg=${rg}:rb=${rb}:gr=${gr}:gg=${gg}:gb=${gb}:br=${br}:bg=${bg}:bb=${bb}`;
  
  // Handle bias by using curves filter if significant bias values exist
  const hasSignificantBias = Math.abs(rBias) > 0.01 || Math.abs(gBias) > 0.01 || Math.abs(bBias) > 0.01;
  
  if (hasSignificantBias) {
    // Convert bias to brightness adjustment (-1 to 1 range)
    const rBrightnessAdjust = Math.max(-1, Math.min(1, rBias * 2));
    const gBrightnessAdjust = Math.max(-1, Math.min(1, gBias * 2));
    const bBrightnessAdjust = Math.max(-1, Math.min(1, bBias * 2));
    
    // Add eq filter for brightness adjustment
    filterString += `,eq=brightness=${(rBrightnessAdjust + gBrightnessAdjust + bBrightnessAdjust) / 3}`;
  }
  
  return filterString;
}

// Alternative approach using a more compatible filter chain
function createCompatibleFilterChain(matrix) {
  if (!matrix || matrix.length !== 20) {
    return null;
  }

  const [rr, rg, rb, ra, rBias,
         gr, gg, gb, ga, gBias, 
         br, bg, bb, ba, bBias,
         ar, ag, ab, aa, aBias] = matrix;

  // Build filter chain step by step
  let filters = [];
  
  // 1. Apply color channel mixing
  filters.push(`colorchannelmixer=rr=${rr}:rg=${rg}:rb=${rb}:gr=${gr}:gg=${gg}:gb=${gb}:br=${br}:bg=${bg}:bb=${bb}`);
  
  // 2. Apply brightness/contrast adjustments for bias
  if (Math.abs(rBias) > 0.01 || Math.abs(gBias) > 0.01 || Math.abs(bBias) > 0.01) {
    const avgBias = (rBias + gBias + bBias) / 3;
    const brightness = Math.max(-1, Math.min(1, avgBias * 0.5));
    filters.push(`eq=brightness=${brightness}`);
  }
  
  return filters.join(',');
}

// Simplified filter approach for better compatibility
function getSimplifiedFilter(filterId) {
  const filterMap = {
    'grayscale': 'colorchannelmixer=.299:.587:.114:0:.299:.587:.114:0:.299:.587:.114',
    'sepia': 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    'cool': 'colorchannelmixer=0.8:0:0.2:0:0:0.9:0.1:0:0:0:1.2',
    'warm': 'colorchannelmixer=1.2:0:0:0:0:1.0:0:0:0:0:0.8,eq=brightness=0.1',
    'vintage': 'colorchannelmixer=0.6:0.3:0.1:0:0.2:0.7:0.1:0:0.1:0.2:0.7',
    'cinematic': 'colorchannelmixer=1.2:-0.05:-0.1:0:-0.1:1.1:-0.1:0:-0.05:0.05:1.3',
    'dramatic': 'eq=contrast=1.5:brightness=0',
    'inverted': 'negate',
    'retro_vhs': 'colorchannelmixer=1.1:0.3:-0.2:0:-0.1:0.9:0.4:0:0.2:-0.1:0.8,noise=alls=10:allf=t',
    'tokyo': 'colorchannelmixer=0.9:0.2:0:0:0:1.1:0.3:0:0.2:0:1.3',
    'cairo': 'colorchannelmixer=1.1:0.15:0:0:0.1:1.0:0:0:-0.1:-0.05:0.8',
    'fade': 'colorchannelmixer=0.9:0.05:0.05:0:0.05:0.9:0.05:0:0.05:0.05:0.9',
    'matte': 'colorchannelmixer=0.8:0:0:0:0:0.8:0:0:0:0:0.8,eq=brightness=0.08',
    'soft': 'colorchannelmixer=0.95:0.05:0.05:0:0.05:0.95:0.05:0:0.05:0.05:0.95,eq=brightness=0.01',
    'moody': 'colorchannelmixer=1.1:0:0:0:0:1.1:0:0:0:0:1.1,eq=brightness=-0.02',
    'pastel': 'colorchannelmixer=1.05:0:0:0:0:1.02:0:0:0:0:1.0,eq=brightness=0.02'
  };
  
  return filterMap[filterId] || null;
}

async function processVideoWithFilters(inputPath, filterMatrix, outputPath, filterId = null) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting video processing...', { inputPath, outputPath, filterId });
      
      let command = ffmpeg(inputPath);
      
      // Try simplified filter first if we have a filterId
      let filterString = null;
      if (filterId) {
        filterString = getSimplifiedFilter(filterId);
        console.log('Using simplified filter for', filterId, ':', filterString);
      }
      
      // Fallback to matrix-based filter if no simplified version exists
      if (!filterString && filterMatrix) {
        filterString = createCompatibleFilterChain(filterMatrix);
        console.log('Using matrix-based filter:', filterString);
      }
      
      // Apply video filter if we have one
      if (filterString) {
        command = command.videoFilters(filterString);
      }
      
      // Configure output with safer settings
      command
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .outputOptions([
          '-preset medium',  // Changed from 'fast' to 'medium' for better compatibility
          '-crf 23',
          '-movflags +faststart',
          '-pix_fmt yuv420p',  // Ensure compatible pixel format
          '-profile:v baseline',  // Use baseline profile for maximum compatibility
          '-level 3.0'  // Ensure compatibility
        ])
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + Math.round(progress.percent || 0) + '% done');
        })
        .on('end', () => {
          console.log('Video processing completed successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          console.error('FFmpeg stderr:', err.message);
          reject(new Error(`Video processing failed: ${err.message}`));
        })
        .run();
        
    } catch (error) {
      console.error('Error setting up video processing:', error);
      reject(error);
    }
  });
}

// Helper function to get filter matrix by ID
function getFilterMatrixById(filterId) {
  const filter = VIDEO_FILTER_MATRICES.find(f => f.id === filterId);
  return filter ? filter.matrix : null;
}

// Helper function to check if file is video
function isVideoFile(mimetype) {
  return mimetype && mimetype.startsWith('video/');
}

const downloadFromS3 = async (bucket, key, localPath) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  await pipe(response.Body, fs.createWriteStream(localPath));
};

const uploadToS3 = async (bucket, key, localFilePath, contentType) => {
  const fileContent = await fs.readFile(localFilePath);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    ACL: "public-read"
  }));
  return `https://${bucket}.s3.ap-south-1.amazonaws.com/${encodeURIComponent(key)}`;
};

// createPost  video filter support
export const createPost = async (req, res) => {
  try {
    const { id } = req.user;
    const { body, videoFilter, filterMatrix, imageFilter } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Caption is required" });
    }

    const bucket = file.bucket;
    const key = (file.key || "").trim();
    let postUrl = file.location;
    let mimeType = file.mimetype || file.contentType;

    console.log("Uploaded to S3:", { key, postUrl, mimeType });

    // Handle video filter processing if needed
    if (videoFilter && videoFilter !== "normal" && isVideoFile(mimeType)) {
      try {
        const tempDir = "temp";
        await fs.ensureDir(tempDir);

        const inputPath = path.join(tempDir, `input-${uuidv4()}.mp4`);
        const outputPath = path.join(tempDir, `output-${uuidv4()}.mp4`);

        // Download from S3
        await downloadFromS3(bucket, key, inputPath);

        // Get matrix
        let matrix;
        try {
          matrix = filterMatrix ? JSON.parse(filterMatrix) : getFilterMatrixById(videoFilter);
        } catch {
          matrix = getFilterMatrixById(videoFilter);
        }

        if (!matrix && !getFilterMatrixById(videoFilter)) {
          throw new Error(`No filter found for: ${videoFilter}`);
        }

        // Process video
        await processVideoWithFilters(inputPath, matrix, outputPath, videoFilter);

        // Upload processed video
        const processedKey = `posts/processed-${uuidv4()}.mp4`;
        postUrl = await uploadToS3(bucket, processedKey, outputPath, "video/mp4");
        mimeType = "video/mp4";

        // Clean up
        await fs.remove(inputPath);
        await fs.remove(outputPath);

        // Optional: Delete original upload to save space
        // await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (err) {
        console.error("Video processing failed:", err);
        return res.status(422).json({
          success: false,
          message: "Video filter processing failed",
          error: err.message
        });
      }
    }

    // Build and save post
    const postData = {
      postUrl,
      mediaType: mimeType,
      caption: body.trim(),
      hasVideoFilter: !!(videoFilter && videoFilter !== "normal"),
      videoFilter: videoFilter || null,
      hasImageFilter: !!(imageFilter && imageFilter !== "normal"),
      imageFilter: imageFilter || null,
      createdBy: id
    };

    const post = await PostModel.create(postData);

    console.log("Post created:", {
      id: post._id,
      url: post.postUrl
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully!",
      data: post
    });

  } catch (err) {
    console.error("Post creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while creating post",
      error: err.message
    });
  }
};

export const getAllPostByUserId = async (req, res) =>{
    try {
        const { id } = req.user;

        const posts = await PostModel.find({ createdBy: id }).sort({ createdAt: -1 });;

        return res.status(200).json({
            success: true,
            message: 'posts fetched',
            data: posts
        })
    } catch (err) {
        console.log('error fetching posts', err);
        return res.status(500).json({
            success: false,
            message: 'error fetching posts',
            error: err.message
        })
    }
}

export const deletePostById = async (req, res) => {
    try {
        const { id } = req.params;

        if(!id){
            return res.status(404).json({
            success: false,
            message: 'id not found',
        })
        }

        const response = await PostModel.findByIdAndDelete(id);

        return res.status(201).json({
            success: true,
            message: 'Post deleted',
            data: response
        })

    } catch (err) {
        console.log('error deleting posts', err);
        return res.status(500).json({
            success: false,
            message: 'error deleting posts',
            error: err.message
        })
    }
}

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const userId = req.user.id
  const file = req.file; // multer adds the uploaded file here

  try {
    const post = await PostModel.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to update this post" });
    }

    // Handle new uploaded file (if present)
    if (file) {
      post.postUrl = file.path; 
    }

    // Update body if provided
    if (body !== undefined) {
      post.body = body;
    }

    // Save changes
    const updatedPost = await post.save();

    res.status(200).json({
        success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};


