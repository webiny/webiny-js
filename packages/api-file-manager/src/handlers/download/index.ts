import { HandlerPlugin } from "@webiny/handler/types";
import S3 from "aws-sdk/clients/s3";
import sanitizeFilename from "sanitize-filename";
import pathLib from "path";
import { createHandler, getEnvironment, getObjectParams, EventHandlerCallable } from "../utils";
import loaders from "../transform/loaders";
import { ArgsContext } from "@webiny/handler-args/types";
import { DownloadHandlerEventArgs } from "~/handlers/types";
import { ClientContext } from "@webiny/handler-client/types";

const MAX_RETURN_CONTENT_LENGTH = 5000000; // ~4.77MB
const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

interface Context extends ClientContext, ArgsContext<DownloadHandlerEventArgs> {}
/**
 * Based on given path, extracts file key and additional options sent via query params.
 * @param event
 */
const extractFilenameOptions = (event: DownloadHandlerEventArgs) => {
    const path = sanitizeFilename(event.pathParameters.path);
    return {
        filename: decodeURI(path),
        options: event.queryStringParameters,
        extension: pathLib.extname(path)
    };
};

const getS3Object = async (event: DownloadHandlerEventArgs, s3: S3, context: Context) => {
    const { options, filename, extension } = extractFilenameOptions(event);

    for (const loader of loaders) {
        const canProcess = loader.canProcess({
            context,
            s3,
            options,
            file: {
                name: filename,
                extension
            }
        });

        if (!canProcess) {
            continue;
        }
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

    // If no processors handled the file request, just return the S3 object by default.
    const params = getObjectParams(filename);
    return {
        object: await s3.getObject(params).promise(),
        params: params
    };
};

export default (): HandlerPlugin<Context> => ({
    type: "handler",
    name: "handler-download-file",
    async handle(context) {
        const eventHandler: EventHandlerCallable<DownloadHandlerEventArgs> = async event => {
            const { region } = getEnvironment();
            const s3 = new S3({ region });

            const { params, object } = await getS3Object(event, s3, context);

            const contentLength = object.ContentLength === undefined ? 0 : object.ContentLength;
            if (contentLength < MAX_RETURN_CONTENT_LENGTH) {
                return {
                    /**
                     * It is safe to cast as buffer or unknown
                     */
                    data: object.Body || null,
                    headers: {
                        "Content-Type": object.ContentType,
                        "Cache-Control": "public, max-age=" + DEFAULT_CACHE_MAX_AGE
                    }
                };
            }

            // For pre-5.29.0 systems, we need to make large files publicly accessible.
            // For >=5.29.0 systems, permissions are granted based on Origin Access Identity, and this block is ignored.
            if (process.env.PULUMI_APPS !== "true") {
                await s3
                    .putObjectAcl({
                        Bucket: params.Bucket,
                        ACL: "public-read",
                        Key: params.Key
                    })
                    .promise();
            }

            // Lambda can return max 6MB of content, so if our object's size is larger, we are sending
            // a 301 Redirect, redirecting the user to the public URL of the object in S3.
            return {
                data: null,
                statusCode: 301,
                headers: {
                    Location: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`
                }
            };
        };
        const handler = createHandler(eventHandler);

        return await handler(context.invocationArgs);
    }
});
