import S3 from "aws-sdk/clients/s3";
import sanitizeFilename from "sanitize-filename";
import pathLib from "path";
import { getEnvironment, getObjectParams } from "../utils";
import loaders from "../transform/loaders";
import { RoutePlugin } from "@webiny/handler-aws/gateway";
import { Context, Request } from "@webiny/handler/types";

const MAX_RETURN_CONTENT_LENGTH = 5000000; // ~4.77MB
const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year
const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes
/**
 * Based on given path, extracts file key and additional options sent via query params.
 */
const extractFilenameOptions = (request: Request) => {
    const path = sanitizeFilename((request.params as any).path);
    return {
        filename: decodeURI(path),
        options: request.query as any,
        extension: pathLib.extname(path)
    };
};

const getS3Object = async (request: Request, s3: S3, context: Context) => {
    const { options, filename, extension } = extractFilenameOptions(request);

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

export const createDownloadFilePlugins = () => {
    return [
        new RoutePlugin(({ onGet, context }) => {
            onGet("/files/:path", async (request, reply) => {
                const { region } = getEnvironment();
                const s3 = new S3({ region });

                const { params, object } = await getS3Object(request, s3, context);

                const contentLength = object.ContentLength === undefined ? 0 : object.ContentLength;
                if (contentLength < MAX_RETURN_CONTENT_LENGTH) {
                    return reply
                        .headers({
                            "Content-Type": object.ContentType,
                            "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`,
                            "x-base64-encoded": true
                        })
                        .send(object?.Body || "");
                }

                const presignedUrl = await s3.getSignedUrlPromise("getObject", {
                    Bucket: params.Bucket,
                    Key: params.Key,
                    Expires: PRESIGNED_URL_EXPIRATION
                });
                // Lambda can return max 6MB of content, so if our object's size is larger, we are sending
                // a 301 Redirect, redirecting the user to the public URL of the object in S3.
                return reply
                    .code(301)
                    .headers({
                        Location: presignedUrl,
                        "Cache-Control": "public, max-age=" + PRESIGNED_URL_EXPIRATION
                    })
                    .send("");
            });
        })
    ];
};
