// @flow
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
    },
    async process({ s3, key, extension }) {
        // 1. Get optimized image's key.
        s3.deleteObject(getObjectParams(getImageKey({ key })));

        // 2. Search for all transformed images and delete those too.
        if (SUPPORTED_TRANSFORMABLE_IMAGES.includes(extension)) {
            const env = getEnvironment();
            const imagesList = await s3
                .listObjects({
                    Bucket: env.bucket,
                    Prefix: getOptimizedTransformedImageKeyPrefix(key)
                })
                .promise();

            console.log({ imagesList });
            for (let i = 0; i < imagesList.length; i++) {
                let imageObject = imagesList[i];
                console.log(imageObject)
            }
        }
    }
};
