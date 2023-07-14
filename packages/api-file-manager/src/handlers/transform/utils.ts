import objectHash from "object-hash";

const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif", ".webp"];
const SUPPORTED_TRANSFORMABLE_IMAGES = [".jpg", ".jpeg", ".png", ".webp"];

const OPTIMIZED_TRANSFORMED_IMAGE_PREFIX = "img-o-t-";
const OPTIMIZED_IMAGE_PREFIX = "img-o-";

const getOptimizedImageKeyPrefix = (key: string): string => {
    const [id, name] = key.split("/");
    return `${id}/${OPTIMIZED_IMAGE_PREFIX}${name}`;
};

const getOptimizedTransformedImageKeyPrefix = (
    key: string,
    transformationsHash: string
): string => {
    const [id, name] = key.split("/");
    return `${id}/${OPTIMIZED_TRANSFORMED_IMAGE_PREFIX}${transformationsHash}-${name}`;
};

interface GetImageKeyParams {
    key: string;
    transformations?: any;
}

const getImageKey = ({ key, transformations }: GetImageKeyParams): string => {
    if (!transformations) {
        return getOptimizedImageKeyPrefix(key);
    }

    return getOptimizedTransformedImageKeyPrefix(key, objectHash(transformations));
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
