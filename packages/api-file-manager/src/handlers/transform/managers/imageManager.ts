import S3 from "aws-sdk/clients/s3";
import { getObjectParams, getEnvironment } from "~/handlers/utils";
import * as newUtils from "../utils";
import * as legacyUtils from "../legacyUtils";

export interface ImageManagerCanProcessParams {
    key: string;
    extension: string;
}
export interface ImageManagerProcessParams {
    s3: S3;
    key: string;
    extension: string;
}
export default {
    canProcess: (params: ImageManagerCanProcessParams) => {
        const { key, extension } = params;
        const utils = key.includes("/") ? newUtils : legacyUtils;

        if (!utils.SUPPORTED_IMAGES.includes(extension)) {
            return false;
        }

        // We only want to process original images, and delete all variations of it at once.
        // We DO NOT want to process the event for the deletion of an optimized/transformed image.
        // Unfortunately, there's no way to filter those events on the S3 bucket itself, so we have to do it this way.
        return !(
            key.startsWith(utils.OPTIMIZED_IMAGE_PREFIX) ||
            key.startsWith(utils.OPTIMIZED_TRANSFORMED_IMAGE_PREFIX)
        );
    },
    async process({ s3, key, extension }: ImageManagerProcessParams) {
        const utils = key.includes("/") ? newUtils : legacyUtils;

        // 1. Get optimized image key.
        await s3.deleteObject(getObjectParams(utils.getImageKey({ key }))).promise();

        if (!utils.SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension)) {
            return;
        }

        // 2. Search for all transformed images and delete those too.
        const prefix = key.includes("/")
            ? // New keys
              key.split("/")[0] + "/"
            : // Legacy keys
              utils.getOptimizedImageKeyPrefix(key);

        const env = getEnvironment();
        const imagesList = await s3
            .listObjects({
                Bucket: env.bucket,
                Prefix: prefix
            })
            .promise();

        if (!imagesList.Contents) {
            return;
        }

        for (const imageObject of imagesList.Contents) {
            if (!imageObject.Key) {
                continue;
            }
            await s3.deleteObject(getObjectParams(imageObject.Key)).promise();
        }
    }
};
