// @ts-ignore
import sharp from "sharp";

/**
 * Only processing "width" at the moment.
 * Check "sanitizeImageTransformations.js" to allow additional image processing transformations.
 * @param buffer
 * @param transformations
 * @returns {Promise<Buffer>}
 */
export default async (buffer, transformations) => {
    const { width } = transformations;
    return await sharp(buffer)
        .resize({ width })
        .toBuffer();
};
