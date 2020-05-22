import sanitizeImageTransformations from "./sanitizeImageTransformations";
import Lambda from "aws-sdk/clients/lambda";
import { getObjectParams, getEnvironment } from "../../../utils";
import { SUPPORTED_IMAGES, SUPPORTED_TRANSFORMABLE_IMAGES, getImageKey } from "../utils";

// @ts-ignore
const IMAGE_TRANSFORMER_FUNCTION = process.env.IMAGE_TRANSFORMER_FUNCTION;

interface TransformerParams {
    key: string;
    transformations?: any;
}

const callImageTransformerLambda = async ({ key, transformations }: TransformerParams) => {
    const env = getEnvironment();
    const imageTransformerLambda = new Lambda({ region: env.region });
    const response = await imageTransformerLambda
        .invoke({
            FunctionName: IMAGE_TRANSFORMER_FUNCTION,
            Payload: JSON.stringify({
                body: {
                    key,
                    transformations
                }
            })
        })
        .promise();

    // @ts-ignore
    return JSON.parse(response.Payload);
};

export default {
    canProcess: opts => {
        return SUPPORTED_IMAGES.includes(opts.file.extension);
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
                const imageTransformerLambdaResponse = await callImageTransformerLambda({
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
            const imageTransformerLambdaResponse = await callImageTransformerLambda({
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
