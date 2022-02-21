/**
 * Sharp is included in the AWS Lambda layer
 */
// @ts-ignore
import sharp from "sharp";
import { Body } from "aws-sdk/clients/s3";

interface Transformation {
    width: string;
}
/**
 * Only processing "width" at the moment.
 * Check "sanitizeImageTransformations.js" to allow additional image processing transformations.
 */
export default async (buffer: Body, transformations: Transformation): Promise<Body> => {
    const { width } = transformations;
    return await sharp(buffer).resize({ width }).toBuffer();
};
