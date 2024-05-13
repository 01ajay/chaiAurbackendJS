import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

//configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINAY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY, // Click 'View Credentials' below to copy your API secret
});

const uploadCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    console.log("file is uploaded to cloudinary", response.url);
    return response;
  } catch (error) {

    fs.unlinkSync(localfilepath); //remove the locally saved temporary file if upload failed
    return null
  }
};


