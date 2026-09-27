import api from './api';

export interface UploadResult {
  fileUrl: string;
  key: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const r2Service = {
  /**
   * Upload a File object to Cloudflare R2 via Backend
   */
  uploadFile: async (file: File, folder: string = 'chat_attachments'): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await api.post('/r2/upload-file', {
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileData: base64Data,
            folder,
          });

          if (res.data && res.data.success) {
            resolve({
              fileUrl: res.data.fileUrl,
              key: res.data.key,
              fileName: res.data.fileName,
              fileSize: res.data.fileSize,
              fileType: res.data.fileType,
            });
          } else {
            reject(new Error(res.data?.message || 'Upload failed'));
          }
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload an audio Blob (voice note) to Cloudflare R2 via Backend
   */
  uploadVoiceBlob: async (blob: Blob, fileName: string = 'voice_note.webm', folder: string = 'chat_voice'): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await api.post('/r2/upload-file', {
            fileName,
            fileType: blob.type || 'audio/webm',
            fileData: base64Data,
            folder,
          });

          if (res.data && res.data.success) {
            resolve({
              fileUrl: res.data.fileUrl,
              key: res.data.key,
              fileName: res.data.fileName,
              fileSize: res.data.fileSize,
              fileType: res.data.fileType,
            });
          } else {
            reject(new Error(res.data?.message || 'Voice upload failed'));
          }
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Determine file category for proper UI rendering
   */
  getFileCategory: (filePath?: string | null, mimeType?: string | null): 'image' | 'video' | 'audio' | 'document' | 'other' => {
    if (!filePath) return 'other';
    const lower = filePath.toLowerCase();
    const typeLower = (mimeType || '').toLowerCase();

    if (
      typeLower.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lower)
    ) {
      return 'image';
    }

    if (
      typeLower.startsWith('video/') ||
      /\.(mp4|webm|mov|mkv|avi|m4v|3gp)$/i.test(lower)
    ) {
      return 'video';
    }

    if (
      typeLower.startsWith('audio/') ||
      /\.(mp3|wav|ogg|webm|m4a|aac|opus)$/i.test(lower)
    ) {
      return 'audio';
    }

    if (
      typeLower.includes('pdf') ||
      typeLower.includes('document') ||
      typeLower.includes('sheet') ||
      typeLower.includes('presentation') ||
      typeLower.includes('text') ||
      /\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar)$/i.test(lower)
    ) {
      return 'document';
    }

    return 'other';
  },

  /**
   * Format bytes to readable size
   */
  formatBytes: (bytes: number, decimals: number = 1): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
};
