const express = require('express');
const router = express.Router();
const r2Helper = require('../helpers/cloudflareR2');

/**
 * GET /r2/upload-url
 * Query params: key, contentType
 */
router.get('/upload-url', async (req, res) => {
    try {
        const { key, contentType } = req.query;
        if (!key || !contentType) {
            return res.status(400).json({ success: false, message: 'Key and contentType are required' });
        }

        const url = await r2Helper.getUploadSignedUrl(key, contentType);
        const publicUrl = `${r2Helper.PUBLIC_URL_PREFIX}/${key}`;
        res.json({ success: true, url, publicUrl, key });
    } catch (error) {
        console.error('Error generating Cloudflare R2 signed URL:', error);
        res.status(500).json({ success: false, message: 'Failed to generate signed URL', error: error.message });
    }
});

/**
 * POST /r2/upload-file
 * Body: { fileName, fileType, fileData, folder }
 * fileData: Base64 data string (with or without data URL prefix)
 */
router.post('/upload-file', async (req, res) => {
    try {
        const { fileName, fileType, fileData, folder = 'chat' } = req.body;
        if (!fileData) {
            return res.status(400).json({ success: false, message: 'fileData is required (Base64 string)' });
        }

        // Clean base64 string
        let base64Content = fileData;
        let detectedType = fileType || 'application/octet-stream';

        if (fileData.includes(';base64,')) {
            const parts = fileData.split(';base64,');
            const match = parts[0].match(/data:(.*)/);
            if (match && match[1]) {
                detectedType = match[1];
            }
            base64Content = parts[1];
        }

        const buffer = Buffer.from(base64Content, 'base64');
        const cleanName = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const timestamp = Date.now();
        const key = `${folder}/${timestamp}_${cleanName}`;

        const uploadResult = await r2Helper.uploadFileBuffer(key, buffer, detectedType);
        if (!uploadResult) {
            return res.status(500).json({ success: false, message: 'Failed to upload file to Cloudflare R2' });
        }

        res.json({
            success: true,
            fileUrl: uploadResult.publicUrl,
            key: uploadResult.key,
            fileName: cleanName,
            fileSize: buffer.length,
            fileType: detectedType
        });
    } catch (error) {
        console.error('Error uploading file to Cloudflare R2:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

/**
 * POST /r2/delete
 * Body: { key }
 */
router.post('/delete', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) {
            return res.status(400).json({ success: false, message: 'Key is required' });
        }

        await r2Helper.deleteObject(key);
        res.json({ success: true, message: 'Object deleted successfully from Cloudflare R2' });
    } catch (error) {
        console.error('Error deleting Cloudflare R2 object:', error);
        res.status(500).json({ success: false, message: 'Failed to delete object', error: error.message });
    }
});

module.exports = router;
