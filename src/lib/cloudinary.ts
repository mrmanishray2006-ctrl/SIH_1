import { v2 as cloudinary } from "cloudinary";

const isCloudinaryConfigured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImage(fileBase64OrUrl: string, folder = "qrshop"): Promise<string> {
  if (!isCloudinaryConfigured) {
    // Return base64 or placeholder gracefully if Cloudinary credentials are not set
    return fileBase64OrUrl;
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder,
      resource_type: "auto",
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to original data URI:", error);
    return fileBase64OrUrl;
  }
}
