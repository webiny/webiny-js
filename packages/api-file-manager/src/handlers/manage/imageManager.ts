import { dirname } from "path";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { getObjectParams, getEnvironment } from "~/handlers/utils";
import * as newUtils from "./utils";
import * as legacyUtils from "./legacyUtils";

const isLegacyKey = (key: string) => {
    return !key.includes("/");
};

export interface ImageManagerCanProcessParams {
    key: string;
    extension: string;
}
export interface ImageManagerProcessParams {
    s3: S3;
    key: string;
    extension: string;
}
export const imageManager = {
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
        await s3.deleteObject(getObjectParams(utils.getImageKey({ key })));

        if (!utils.SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension)) {
            return;
        }

        /**
         * Search for all transformed images and delete those too.
         *
         * For new keys, we take the entire path, up to, but not including, the file name:
         *  - demo-pages/60228148f98841000981c724/welcome-to-webiny__idp.svg
         *  - 60228148f98841000981c724/welcome-to-webiny__idp.svg
         *
         * Legacy keys don't have sub-folders:
         *  - 8ldc5n3w2-custom-field-renderers.mp4
         */

        const prefix = isLegacyKey(key)
            ? utils.getOptimizedImageKeyPrefix(key)
            : dirname(key) + "/";

        const env = getEnvironment();
        const imagesList = await s3.listObjects({
            Bucket: env.bucket,
            Prefix: prefix
        });

        if (!imagesList.Contents) {
            return;
        }

        for (const imageObject of imagesList.Contents) {
            if (!imageObject.Key) {
                continue;
            }
            await s3.deleteObject(getObjectParams(imageObject.Key));
        }
    }
};
