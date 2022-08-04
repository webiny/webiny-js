import sanitizeImageTransformations from "./sanitizeImageTransformations";
import { getObjectParams } from "../../utils";
import { SUPPORTED_IMAGES, SUPPORTED_TRANSFORMABLE_IMAGES, getImageKey } from "../utils";
import { ClientContext } from "@webiny/handler-client/types";
import S3 from "aws-sdk/clients/s3";

const IMAGE_TRANSFORMER_FUNCTION = process.env.IMAGE_TRANSFORMER_FUNCTION as string;

interface TransformerParams {
    context: ClientContext;
    key: string;
    transformations?: {
        width?: number;
    };
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
interface File {
    extension: string;
    name: string;
}
interface Options {
    width?: string;
}
export interface CanProcessParams {
    s3: S3;
    file: File;
    options?: Options;
    context: ClientContext;
}
export interface ProcessParams {
    s3: S3;
    file: File;
    options?: Options;
    context: ClientContext;
}
export default {
    canProcess: (params: CanProcessParams) => {
        return SUPPORTED_IMAGES.includes(params.file.extension);
    },
    async process({ s3, file, options, context }: ProcessParams) {
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
