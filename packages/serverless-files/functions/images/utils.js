const objectHash = require("object-hash");

const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif"];
const SUPPORTED_TRANSFORMABLE_IMAGES = [".jpg", ".jpeg", ".png"];

const OPTIMIZED_TRANSFORMED_IMAGE_PREFIX = "img-o-t-";
const OPTIMIZED_IMAGE_PREFIX = "img-o-";

const getOptimizedImageKeyPrefix = key => {
    return `${OPTIMIZED_IMAGE_PREFIX}${objectHash(key)}-`;
};

const getOptimizedTransformedImageKeyPrefix = key => {
    return `${OPTIMIZED_TRANSFORMED_IMAGE_PREFIX}${objectHash(key)}-`;
};

const getImageKey = ({ key, transformations }) => {
    if (!transformations) {
        const prefix = getOptimizedImageKeyPrefix(key);
        return prefix + key;
    }

    const prefix = getOptimizedTransformedImageKeyPrefix(key);
    return `${prefix}${objectHash(transformations)}-${key}`;
};

module.exports = {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    OPTIMIZED_IMAGE_PREFIX,
    getImageKey,
    getOptimizedImageKeyPrefix,
    getOptimizedTransformedImageKeyPrefix
};
