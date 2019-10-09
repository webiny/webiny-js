const sharp = require("sharp");

/**
 * Only processing "width" at the moment.
 * Check "sanitizeImagetransformations.js" to allow additional image processing transformations.
 * @param buffer
 * @param transformations
 * @returns {Promise<void>}
 */
module.exports = async (buffer, transformations) => {
    const { width } = transformations;
    return await sharp(buffer)
        .resize({ width })
        .toBuffer();
};
