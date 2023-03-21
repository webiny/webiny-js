import S3 from "aws-sdk/clients/s3";
import { getObjectParams, getEnvironment } from "~/handlers/utils";
import {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_IMAGE_PREFIX,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    getImageKey
} from "../utils";

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
        if (SUPPORTED_IMAGES.includes(extension) === false) {
            return false;
        }

        // We only want to process original images, and delete all variations of it at once.
        // We DO NOT want to process the event for the deletion of an optimized/transformed image.
        // Unfortunately, there's no way to filter those events on the S3 bucket itself, so we have to do it this way.
        return !(
            key.startsWith(OPTIMIZED_IMAGE_PREFIX) ||
            key.startsWith(OPTIMIZED_TRANSFORMED_IMAGE_PREFIX)
        );
    },
    async process({ s3, key, extension }: ImageManagerProcessParams) {
        // 1. Get optimized image's key.

        await s3.deleteObject(getObjectParams(getImageKey({ key }))).promise();

        // 2. Search for all transformed images and delete those too.
        if (SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension) === false) {
            return;
        }
        const [id] = key.split("/");
        const env = getEnvironment();
        const imagesList = await s3
            .listObjects({
                Bucket: env.bucket,
                Prefix: `${id}/`
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
