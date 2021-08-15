import { HandlerPlugin } from "@webiny/handler/types";
import S3 from "aws-sdk/clients/s3";
import sanitizeFilename from "sanitize-filename";
import pathLib from "path";
import { createHandler, getEnvironment, getObjectParams } from "../utils";
import loaders from "../transform/loaders";

const MAX_RETURN_CONTENT_LENGTH = 5000000; // ~4.77MB
const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

/**
 * Based on given path, extracts file key and additional options sent via query params.
 * @param event
 */
const extractFilenameOptions = event => {
    const path = sanitizeFilename(event.pathParameters.path);
    return {
        filename: decodeURI(path),
        options: event.queryStringParameters,
        extension: pathLib.extname(path)
    };
};

const getS3Object = async (event, s3, context) => {
    const { options, filename, extension } = extractFilenameOptions(event);

    for (let i = 0; i < loaders.length; i++) {
        const loader = loaders[i];
        const canProcess = loader.canProcess({
            context,
            s3,
            options,
            file: {
                name: filename,
                extension
            }
        });

        if (canProcess) {
            return loader.process({
                context,
                s3,
                options,
                file: {
                    name: filename,
                    extension
                }
            });
        }
    }

    // If no processors handled the file request, just return the S3 object by default.
    const params = getObjectParams(filename);
    return {
        object: await s3.getObject(params).promise(),
        params: params
    };
};

export default (): HandlerPlugin => ({
    type: "handler",
    name: "handler-download-file",
    async handle(context) {
        const event = context.invocationArgs;

        const handler = createHandler(async event => {
            const { region } = getEnvironment();
            const s3 = new S3({ region });

            const { params, object } = await getS3Object(event, s3, context);

            if (object.ContentLength < MAX_RETURN_CONTENT_LENGTH) {
                return {
                    data: object.Body,
                    headers: {
                        "Content-Type": object.ContentType,
                        "Cache-Control": "public, max-age=" + DEFAULT_CACHE_MAX_AGE
                    }
                };
            }

            // Lambda can return max 6MB of content, so if our object's size is larger, we are sending
            // a 301 Redirect, redirecting the user to the public URL of the object in S3.
            await s3
                .putObjectAcl({
                    Bucket: params.Bucket,
                    ACL: "public-read",
                    Key: params.Key
                })
                .promise();

            return {
                statusCode: 301,
                headers: {
                    Location: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`
                }
            };
        });

        return await handler(event);
    }
});
