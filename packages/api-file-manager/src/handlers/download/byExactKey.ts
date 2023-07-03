import S3 from "aws-sdk/clients/s3";
import { getEnvironment } from "../utils";
import { RoutePlugin } from "@webiny/handler-aws/gateway";
import { getS3Object, isSmallObject } from "~/handlers/download/getS3Object";
import { extractFileInformation } from "~/handlers/download/extractFileInformation";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year
const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

const { region } = getEnvironment();
const s3 = new S3({ region });

export const createDownloadFileByExactKeyPlugins = () => {
    return [
        new RoutePlugin(({ onGet, context }) => {
            onGet("/files/*", async (request, reply) => {
                const fileInfo = extractFileInformation(request);
                const { params, object } = await getS3Object(fileInfo, s3, context);

                if (object && isSmallObject(object)) {
                    console.log("This is a small file; responding with object body.");
                    return reply
                        .headers({
                            "Content-Type": object.ContentType,
                            "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`,
                            "x-webiny-base64-encoded": true
                        })
                        .send(object.Body || "");
                }

                console.log("This is a large object; redirecting to a presigned URL.");

                const presignedUrl = s3.getSignedUrl("getObject", {
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
