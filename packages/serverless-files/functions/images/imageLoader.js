const sanitizeImageTransformations = require("./imageLoader/sanitizeImageTransformations");
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

    return JSON.parse(response.Payload);
};

module.exports = {
    canProcess: ({ file }) => {
        return SUPPORTED_IMAGES.includes(file.extension);
    },
    async process({ s3, file, options }) {
        // Loaders must return {object, params} object.
        let objectParams;

        const transformations = sanitizeImageTransformations(options);

        if (transformations && SUPPORTED_TRANSFORMABLE_IMAGES.includes(file.extension)) {
            objectParams = getObjectParams(getImageKey({ key: file.name, transformations }));
            try {
                return {
                    object: await s3.getObject(objectParams).promise(),
                    params: objectParams
                };
            } catch (e) {
                let imageTransformerLambdaResponse = await callImageTransformerLambda({
                    key: file.name,
                    transformations
                });

                if (imageTransformerLambdaResponse.error) {
                    throw Error(imageTransformerLambdaResponse.message);
                }

                return {
                    object: await s3.getObject(objectParams).promise(),
                    params: objectParams
                };
            }
        }

        objectParams = getObjectParams(getImageKey({ key: file.name }));
        try {
            return {
                object: await s3.getObject(objectParams).promise(),
                params: objectParams
            };
        } catch (e) {
            let imageTransformerLambdaResponse = await callImageTransformerLambda({
                key: file.name
            });

            if (imageTransformerLambdaResponse.error) {
                throw Error(imageTransformerLambdaResponse.message);
            }

            return {
                object: await s3.getObject(objectParams).promise(),
                params: objectParams
            };
        }
    }
};
