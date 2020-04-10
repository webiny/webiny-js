const { getObjectParams, getEnvironment } = require("./../utils");
const {
    SUPPORTED_IMAGES,
    SUPPORTED_TRANSFORMABLE_IMAGES,
    OPTIMIZED_IMAGE_PREFIX,
    OPTIMIZED_TRANSFORMED_IMAGE_PREFIX,
    getImageKey,
    getOptimizedTransformedImageKeyPrefix
} = require("./utils");

module.exports = {
    canProcess: ({ key, extension }) => {
        if (!SUPPORTED_IMAGES.includes(extension)) {
            return false;
        }

        if (
            key.startsWith(
                OPTIMIZED_IMAGE_PREFIX || key.startsWith(OPTIMIZED_TRANSFORMED_IMAGE_PREFIX)
            )
        ) {
            return false;
        }

        return true;
    },
    async process({ s3, key, extension }) {
        // 1. Get optimized image's key.

        await s3.deleteObject(getObjectParams(getImageKey({ key }))).promise();

        // 2. Search for all transformed images and delete those too.
        if (SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension)) {
            const env = getEnvironment();
            const imagesList = await s3
                .listObjects({
                    Bucket: env.bucket,
                    Prefix: getOptimizedTransformedImageKeyPrefix(key)
                })
                .promise();

            for (let i = 0; i < imagesList.Contents.length; i++) {
                let imageObject = imagesList.Contents[i];
                await s3.deleteObject(getObjectParams(imageObject.Key)).promise();
            }
        }
    }
};
