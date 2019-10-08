// @flow
const { sanitizeImageTransformations } = require("./imageLoader/sanitizeImageTransformations");
const Lambda = require("aws-sdk/clients/lambda");
const { getObjectParams, getEnvironment } = require("./../utils");

const { SUPPORTED_IMAGES, SUPPORTED_TRANSFORMABLE_IMAGES, getImageKey } = require("./utils");

const IMAGE_TRANSFORMER_LAMBDA_NAME = process.env.IMAGE_TRANSFORMER_LAMBDA_NAME;

const callImageTransformerLambda = async ({ key, transformations }) => {
    const env = getEnvironment();
    const imageTransformerLambda = new Lambda({ region: env.region });
    let response = await imageTransformerLambda
        .invoke({
            FunctionName: IMAGE_TRANSFORMER_LAMBDA_NAME,
            Payload: JSON.stringify({
                body: {
                    key,
                    transformations
                }
            })
        })
        .promise();

    return JSON.parse(response);
};

export default {
    canProcess: ({ file }) => {
        return SUPPORTED_IMAGES.includes(file.extension);
    },
    async process({ s3, file, options }) {
        let params, key;

        const sanitizedTransformations = sanitizeImageTransformations(options);

        if (
            !sanitizedTransformations.empty &&
            SUPPORTED_TRANSFORMABLE_IMAGES.includes(file.extension)
        ) {
            key = getImageKey(file.name, sanitizedTransformations.transformations);
            params = getObjectParams(key);
            try {
                return await s3.getObject(params).promise();
            } catch (e) {
                let imageTransformerLambdaResponse = await callImageTransformerLambda({
                    key: file.name,
                    transformations: sanitizedTransformations
                });

                if (imageTransformerLambdaResponse.error) {
                    throw Error(imageTransformerLambdaResponse.message);
                }

                return await s3.getObject(params).promise();
            }
        }

        key = getImageKey(file.name);
        params = getObjectParams(key);
        try {
            return await s3.getObject(params).promise();
        } catch (e) {
            let imageTransformerLambdaResponse = await callImageTransformerLambda({
                key: file.name,
                transformations: sanitizedTransformations
            });

            if (imageTransformerLambdaResponse.error) {
                throw Error(imageTransformerLambdaResponse.message);
            }

            return await s3.getObject(params).promise();
        }
    }
};
