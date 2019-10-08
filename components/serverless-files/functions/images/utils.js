const objectHash = require("object-hash");

const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif"];
const SUPPORTED_TRANSFORMABLE_IMAGES = [".jpg", ".jpeg", ".png"];

/**
 * This prefix must not be changed, it is used to determine which objects need to
 * expire. Check S3 bucket's lifecycle policies for more information.
 * @type {string}
 */
const OPTIMIZED_TRANSFORMED_IMAGE_PREFIX = "image_optimized_transformed_";
const OPTIMIZED_IMAGE_PREFIX = "image_optimized_original_";

const getImageKey = (key, options) => {
    if (!options) {
        return `${OPTIMIZED_IMAGE_PREFIX}${objectHash(key)}_${key}`;
    }

    return `${OPTIMIZED_TRANSFORMED_IMAGE_PREFIX}${objectHash(key)}_${objectHash(options)}_{${key}`;
};

module.exports = {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    OPTIMIZED_IMAGE_PREFIX,
    getImageKey
};
