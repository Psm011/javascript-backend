import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'


    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API__KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadfileoncloudinary = async (filepath) => {
    if (!filepath) return null;
    try {
        const uploadResult = await cloudinary.uploader.upload(filepath, {
            resource_type: 'auto',
        });
        console.log("file uploaded successfully",uploadResult.url)
        fs.unlinkSync(filepath);
        return uploadResult;
    } catch (error) {
        console.error('Cloudinary upload failed:', error);
        return null;
    }
};