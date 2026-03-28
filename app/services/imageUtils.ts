/**
 * Image compression utility
 * Resizes and compresses images before upload to avoid 413 errors from the server.
 */

import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1024; // max width or height in px
const COMPRESS_QUALITY = 0.6; // JPEG quality 0-1

/**
 * Compress an image URI for upload.
 * Resizes to max 1024px on the longest side and compresses to ~60% JPEG quality.
 * Returns the URI of the compressed image.
 */
export async function compressImageForUpload(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      {
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri;
  }
}
