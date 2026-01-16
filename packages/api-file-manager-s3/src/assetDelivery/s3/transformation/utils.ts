import objectHash from "object-hash";
import path from "node:path";

const SUPPORTED_TRANSFORMABLE_IMAGES = ["jpg", "jpeg", "png", "webp"];

const parseKey = (key: string) => {
    const filename = path.basename(key);
    const dirname = path.dirname(key);

    return { filename, dirname };
};

const getOptimizedImageKeyPrefix = (key: string): string => {
    const { filename, dirname } = parseKey(key);

    return `${dirname}/optimized/${filename}`;
};

const getOptimizedTransformedImageKeyPrefix = (
    key: string,
    transformationsHash: string
): string => {
    const { filename, dirname } = parseKey(key);

    return `${dirname}/optimized/${transformationsHash}-${filename}`;
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
    SUPPORTED_TRANSFORMABLE_IMAGES,
    getImageKey,
    getOptimizedImageKeyPrefix,
    getOptimizedTransformedImageKeyPrefix
};
