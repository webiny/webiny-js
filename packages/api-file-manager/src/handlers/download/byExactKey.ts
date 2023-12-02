import { HandlerOnRequestPlugin, RoutePlugin } from "@webiny/handler";
import { S3, getSignedUrl, GetObjectCommand } from "@webiny/aws-sdk/client-s3";
import { getEnvironment } from "../utils";
import { getS3Object, isSmallObject } from "~/handlers/download/getS3Object";
import { extractFileInformation } from "~/handlers/download/extractFileInformation";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year
const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

const { region } = getEnvironment();
const s3 = new S3({ region });

export const createDownloadFileByExactKeyPlugins = () => {
    return [
        new HandlerOnRequestPlugin(async _request => {
            // const fileInfo = extractFileInformation(request);
            //
            // // TODO: get file metadata
            //
            // const metadata = { tenant: "root", locale: "en-US" };
            // request.headers = {
            //     ...request.headers,
            //     "x-tenant": metadata.tenant,
            //     "x-i18n-locale": metadata.locale
            // };
        }),
        new RoutePlugin(({ onGet, context }) => {
            onGet("/files/*", async (request, reply) => {
                const fileInfo = extractFileInformation(request);
                const { params, object } = await getS3Object(fileInfo, s3, context);

                // Feature flag check
                // if (context.wcp.canUsePrivateFiles()) {
                //     // TODO: implement actual check (`private` flag on a file)
                //     if (!canAccess) {
                //         return reply
                //             .code(403)
                //             .headers({
                //                 "Content-Type": "application/json",
                //                 "Cache-Control": "no-cache, no-store, must-revalidate"
                //             })
                //             .send({ error: "You're not allowed to access this file!" });
                //     }
                // }

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

                const presignedUrl = getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: params.Bucket,
                        Key: params.Key
                    }),
                    { expiresIn: PRESIGNED_URL_EXPIRATION }
                );

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
