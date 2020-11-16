import sanitizeImageTransformations from "./sanitizeImageTransformations";
import { getObjectParams } from "../../utils";
import { SUPPORTED_IMAGES, SUPPORTED_TRANSFORMABLE_IMAGES, getImageKey } from "../utils";
import { Context } from "@webiny/handler/types";
import { ClientContext } from "@webiny/handler-client/types";

// @ts-ignore
const IMAGE_TRANSFORMER_FUNCTION = process.env.IMAGE_TRANSFORMER_FUNCTION;

interface TransformerParams {
    context: Context & ClientContext;
    key: string;
    transformations?: any;
}

const callImageTransformerLambda = async ({ key, transformations, context }: TransformerParams) => {
    return await context.handlerClient.invoke({
        name: IMAGE_TRANSFORMER_FUNCTION,
        payload: {
            body: {
                key,
                transformations
            }
        }
    });
};

export default {
    canProcess: opts => {
        return SUPPORTED_IMAGES.includes(opts.file.extension);
    },
    async process({ s3, file, options, context }) {
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
                    transformations,
                    context
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
                key: file.name,
                context
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
