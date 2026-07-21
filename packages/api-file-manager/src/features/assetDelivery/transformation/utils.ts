import objectHash from "object-hash";
import path from "node:path";

const SUPPORTED_TRANSFORMABLE_IMAGES = ["jpg", "jpeg", "png", "webp"];

const parseKey = (key: string) => {
    const filename = path.basename(key);
    const dirname = path.dirname(key);

    return { filename, dirname };
};

// An optional per-file crop signature segment. Keeps un-cropped keys unchanged
// (backward compatible) while giving cropped files their own cache namespace, so
// changing a file's crop invalidates its derivatives.
const cropSegment = (cropSignature?: string): string => {
    return cropSignature ? `${cropSignature}/` : "";
};

const getOptimizedImageKeyPrefix = (key: string, cropSignature?: string): string => {
    const { filename, dirname } = parseKey(key);

    return `${dirname}/optimized/${cropSegment(cropSignature)}${filename}`;
};

const getOptimizedTransformedImageKeyPrefix = (
    key: string,
    transformationsHash: string,
    cropSignature?: string
): string => {
    const { filename, dirname } = parseKey(key);

    return `${dirname}/optimized/${cropSegment(cropSignature)}${transformationsHash}-${filename}`;
};

interface Crop {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/** Short, stable signature of a crop; `undefined` for no/empty crop (so keys are unchanged). */
const getCropSignature = (crop?: Crop): string | undefined => {
    if (!crop || (crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0)) {
        return undefined;
    }
    return objectHash(crop).slice(0, 16);
};

interface Framing {
    crop?: Crop;
    focal?: { x: number; y: number };
    aspectRatio?: number;
}

/**
 * Signature for a full framing (crop + focal + aspect ratio) used to namespace
 * cached derivatives. `undefined` when the framing is a no-op. A crop-only framing
 * intentionally hashes to the same value as `getCropSignature`, so existing
 * asset-level-crop derivatives keep their cache keys (backward compatible).
 */
const getFramingSignature = (framing: Framing): string | undefined => {
    const { crop, focal, aspectRatio } = framing;
    const cropped =
        !!crop && !(crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0);

    if (!cropped && aspectRatio === undefined) {
        return undefined;
    }
    // Preserve the legacy crop-only key.
    if (cropped && focal === undefined && aspectRatio === undefined) {
        return objectHash(crop).slice(0, 16);
    }
    return objectHash({ crop: cropped ? crop : undefined, focal, aspectRatio }).slice(0, 16);
};

interface GetImageKeyParams {
    key: string;
    transformations?: any;
    cropSignature?: string;
}

const getImageKey = ({ key, transformations, cropSignature }: GetImageKeyParams): string => {
    if (!transformations) {
        return getOptimizedImageKeyPrefix(key, cropSignature);
    }

    return getOptimizedTransformedImageKeyPrefix(key, objectHash(transformations), cropSignature);
};

export {
    SUPPORTED_TRANSFORMABLE_IMAGES,
    getImageKey,
    getCropSignature,
    getFramingSignature,
    getOptimizedImageKeyPrefix,
    getOptimizedTransformedImageKeyPrefix
};
export type { Framing };
