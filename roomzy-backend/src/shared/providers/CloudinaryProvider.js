import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.config.js';
import { AppError } from '../errors/AppError.js';

// Initialize the SDK
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

export class CloudinaryProvider {
  static async uploadBuffer(fileBuffer, folder = 'roomzy_general') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          // Optional: Add basic optimization parameters
          transformation: [{ width: 1080, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }]
        },
        (error, result) => {
          if (error) {
            reject(new AppError('Failed to upload image to CDN', 502));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      // Write the buffer to the stream and end it
      uploadStream.end(fileBuffer);
    });
  }

  static async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Log the error but do not necessarily crash the request
      console.error(`Failed to delete image ${publicId} from CDN`, error);
    }
  }
}