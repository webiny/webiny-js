import objectHash from "object-hash";

const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif"];
const SUPPORTED_TRANSFORMABLE_IMAGES = [".jpg", ".jpeg", ".png"];

const OPTIMIZED_TRANSFORMED_IMAGE_PREFIX = "img-o-t-";
const OPTIMIZED_IMAGE_PREFIX = "img-o-";

const getOptimizedImageKeyPrefix = (key: string): string => {
    return `${OPTIMIZED_IMAGE_PREFIX}${objectHash(key)}-`;
};

const getOptimizedTransformedImageKeyPrefix = (key: string): string => {
    return `${OPTIMIZED_TRANSFORMED_IMAGE_PREFIX}${objectHash(key)}-`;
};

interface GetImageKeyParams {
    key: string;
    transformations?: any;
}

const getImageKey = ({ key, transformations }: GetImageKeyParams): string => {
    if (!transformations) {
        const prefix = getOptimizedImageKeyPrefix(key);
        return prefix + key;
    }

    const prefix = getOptimizedTransformedImageKeyPrefix(key);
    return `${prefix}${objectHash(transformations)}-${key}`;
};

export {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    OPTIMIZED_IMAGE_PREFIX,
    getImageKey,
    getOptimizedImageKeyPrefix,
    getOptimizedTransformedImageKeyPrefix
};
