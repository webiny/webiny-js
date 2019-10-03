// @flow
import { sanitizeImageOptions } from "./images";
import Lambda from "aws-sdk/clients/lambda";

const SUPPORTED_IMAGES = [".jpg", ".jpeg", ".png", ".svg", ".gif"];
const SUPPORTED_PROCESSABLE_IMAGES = [".jpg", ".jpeg", ".png"];

/**
 * This prefix must not be changed, it is used to determine which objects need to
 * expire. Check S3 bucket's lifecycle policies for more information.
 * @type {string}
 */
const PROCESSED_IMAGE_PREFIX = "image_processed_";
const ORIGINAL_IMAGE_PREFIX = "image_original_";

export default {
    canProcess: ({ file }) => {
        return SUPPORTED_IMAGES.includes(file.extension);
    },
    async process({ site, s3, file, options }) {
        let params, image;

        const sanitized = sanitizeImageOptions(options);

        if (sanitized.hasOptions && SUPPORTED_PROCESSABLE_IMAGES.includes(file.extension)) {
            params = s3.getObjectParams(`${PROCESSED_IMAGE_PREFIX}${sanitized.hash}_${file.name}`);
            try {
                image = await s3.getObject({ params });
                return {
                    contentType: image.ContentType,
                    src: s3.getObjectUrl(params.Key)
                };
            } catch (e) {
                const getProcessedImageLambda = new Lambda({ region: site.region });
                let processedImageLambdaResponse = await getProcessedImageLambda
                    .invoke({
                        FunctionName: "webiny-proxy-files-processor-image",
                        Payload: JSON.stringify({
                            body: {
                                site,
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
                    throw Error(originalImageLambdaResponse.message);
                }

                image = await s3.getObject({ params });
                return {
                    contentType: image.ContentType,
                    src: s3.getObjectUrl(params.Key)
                };
            }
        }

        params = s3.getObjectParams(ORIGINAL_IMAGE_PREFIX + file.name);
        try {
            image = await s3.getObject({ params });
            return {
                contentType: image.ContentType,
                src: s3.getObjectUrl(params.Key)
            };
        } catch (e) {
            const getOriginalImageLambda = new Lambda({ region: site.region });
            let originalImageLambdaResponse = await getOriginalImageLambda
                .invoke({
                    FunctionName: "webiny-proxy-files-processor-image",
                    Payload: JSON.stringify({
                        body: {
                            site,
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

            image = await s3.getObject({ params });
            return {
                contentType: image.ContentType,
                src: s3.getObjectUrl(params.Key)
            };
        }
    }
};
