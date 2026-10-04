import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs'

dotenv.config({ path: './.env' });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API__KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are missing from backend/.env');
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
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
export { uploadfileoncloudinary };
