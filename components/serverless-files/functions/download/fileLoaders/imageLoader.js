// @flow
const { sanitizeImageOptions } = require("./images");
const Lambda = require("aws-sdk/clients/lambda");
const { getEnvironment } = require("./../../utils");
const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif"];
const SUPPORTED_PROCESSABLE_IMAGES = [".jpg", ".jpeg", ".png"];

/**
 * This prefix must not be changed, it is used to determine which objects need to
 * expire. Check S3 bucket's lifecycle policies for more information.
 * @type {string}
 */
const PROCESSED_IMAGE_PREFIX = "image_processed_";
const ORIGINAL_IMAGE_PREFIX = "image_original_";
const IMAGE_PROCESSOR_LAMBDA_NAME = process.env.IMAGE_PROCESSOR_LAMBDA_NAME;

export default {
    canProcess: ({ file }) => {
        return SUPPORTED_IMAGES.includes(file.extension);
    },
    async process({ s3, file, options }) {
        let params;

        const env = getEnvironment();

        const sanitized = sanitizeImageOptions(options);

        if (sanitized.hasOptions && SUPPORTED_PROCESSABLE_IMAGES.includes(file.extension)) {
            params = s3.getObjectParams(`${PROCESSED_IMAGE_PREFIX}${sanitized.hash}_${file.name}`);
            try {
                return await s3.getObject({ params });
            } catch (e) {
                const getProcessedImageLambda = new Lambda({ region: env.region });
                let processedImageLambdaResponse = await getProcessedImageLambda
                    .invoke({
                        FunctionName: IMAGE_PROCESSOR_LAMBDA_NAME,
                        Payload: JSON.stringify({
                            body: {
                                params: {
                                    original: s3.getObjectParams(ORIGINAL_IMAGE_PREFIX + file.name),
                                    processed: params,
                                    initial: s3.getObjectParams(file.name)
                                },
                                options: sanitized
                            }
                        })
                    })
                    .promise();

                processedImageLambdaResponse = JSON.parse(processedImageLambdaResponse.Payload);
                if (processedImageLambdaResponse.error) {
                    throw Error("Image could not be processed.");
                }

                return await s3.getObject({ params });
            }
        }

        params = s3.getObjectParams(ORIGINAL_IMAGE_PREFIX + file.name);
        try {
            return await s3.getObject({ params });
        } catch (e) {
            const getOriginalImageLambda = new Lambda({ region: env.region });
            let originalImageLambdaResponse = await getOriginalImageLambda
                .invoke({
                    FunctionName: IMAGE_PROCESSOR_LAMBDA_NAME,
                    Payload: JSON.stringify({
                        body: {
                            params: {
                                original: params,
                                initial: s3.getObjectParams(file.name)
                            },
                            options: sanitized
                        }
                    })
                })
                .promise();

            originalImageLambdaResponse = JSON.parse(originalImageLambdaResponse.Payload);
            if (originalImageLambdaResponse.error) {
                throw Error(originalImageLambdaResponse.message);
            }

            return await s3.getObject({ params });
        }
    }
};
