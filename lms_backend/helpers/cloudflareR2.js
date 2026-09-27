const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Cloudflare R2 configuration using AWS SDK v3
// R2 is S3-compatible, so we use the S3Client with Cloudflare credentials and endpoint.
let r2Client = null;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'xenoclass';
const PUBLIC_URL_PREFIX = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-e40543fa86804de8b36110340f75f548.r2.dev';

if (process.env.CLOUDFLARE_R2_ENDPOINT) {
    try {
        let endpointUrl = process.env.CLOUDFLARE_R2_ENDPOINT.trim();
        if (endpointUrl.endsWith('/' + BUCKET_NAME)) {
            endpointUrl = endpointUrl.substring(0, endpointUrl.length - ('/' + BUCKET_NAME).length);
        }
        endpointUrl = endpointUrl.replace(/\/+$/, '');

        r2Client = new S3Client({
            region: 'auto',
            endpoint: endpointUrl,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
        });
        console.log("✅ Cloudflare R2 client initialized successfully (AWS SDK v3).");
    } catch (error) {
        console.error("❌ Error initializing Cloudflare R2 client:", error.message);
    }
} else {
    console.warn("⚠️ Cloudflare R2: CLOUDFLARE_R2_ENDPOINT not found. R2 features will be disabled.");
}

/**
 * Generate a signed URL for uploading an object to Cloudflare R2
 * @param {string} key - The destination key in R2
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<string>} - The signed URL
 */
const getUploadSignedUrl = async (key, contentType) => {
    if (!r2Client) {
        console.warn("⚠️ Cloudflare R2 client not initialized. Skipping getUploadSignedUrl.");
        return null;
    }
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType
    });

    return getSignedUrl(r2Client, command, { expiresIn: 300 });
};

/**
 * Delete an object from Cloudflare R2
 * @param {string} key - The key of the object to delete
 * @returns {Promise<any>}
 */
const deleteObject = async (key) => {
    if (!r2Client) {
        console.warn("⚠️ Cloudflare R2 client not initialized. Skipping deleteObject.");
        return null;
    }
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    return r2Client.send(command);
};

/**
 * Upload a Buffer or stream directly to Cloudflare R2
 * @param {string} key - The destination key in R2
 * @param {Buffer} buffer - The file content as a Buffer
 * @param {string} contentType - The MIME type
 * @returns {Promise<{ key: string, publicUrl: string }>}
 */
const uploadFileBuffer = async (key, buffer, contentType) => {
    if (!r2Client) {
        console.warn("⚠️ Cloudflare R2 client not initialized. Skipping uploadFileBuffer.");
        return null;
    }
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    });

    await r2Client.send(command);
    return {
        key,
        publicUrl: `${PUBLIC_URL_PREFIX}/${key}`
    };
};

module.exports = {
    r2Client,
    getUploadSignedUrl,
    uploadFileBuffer,
    deleteObject,
    PUBLIC_URL_PREFIX,
    BUCKET_NAME
};
