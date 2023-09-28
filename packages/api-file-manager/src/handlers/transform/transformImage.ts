/**
 * Sharp is included in the AWS Lambda layer
 */
// @ts-ignore
import sharp from "sharp";
import { PutObjectCommandInput } from "@webiny/aws-sdk/client-s3";

interface Transformation {
    width: string;
}

export interface TransformOptions {
    animated?: boolean;
}

/**
 * Only processing "width" at the moment.
 * Check "sanitizeImageTransformations.js" to allow additional image processing transformations.
 */
export const transformImage = async (
    buffer: PutObjectCommandInput["Body"],
    transformations: Transformation,
    options: TransformOptions = {}
): Promise<PutObjectCommandInput["Body"]> => {
    const { width } = transformations;
    return await sharp(buffer, { animated: options.animated ?? false })
        .resize({ width })
        .toBuffer();
};
