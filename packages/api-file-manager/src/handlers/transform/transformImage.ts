/**
 * Sharp is included in the AWS Lambda layer
 */
import sharp from "sharp";
import type { Readable } from "stream";

interface Transformation {
    width: number;
}

export interface TransformOptions {
    animated?: boolean;
}

/**
 * Only processing "width" at the moment.
 * Check "sanitizeImageTransformations.js" to allow additional image processing transformations.
 */
export const transformImage = async (
    stream: Readable,
    transformations: Transformation,
    options: TransformOptions = {}
): Promise<Buffer> => {
    const { width } = transformations;
    const transformedImage = sharp({ animated: options.animated ?? false }).resize({
        width
    });

    return await stream.pipe(transformedImage).toBuffer();
};
