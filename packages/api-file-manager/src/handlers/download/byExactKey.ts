import S3 from "aws-sdk/clients/s3";
import { WcpContext } from "@webiny/api-wcp/types";
import { RoutePlugin } from "@webiny/handler-aws/gateway";
import { getEnvironment } from "../utils";
import { getS3Object, isSmallObject } from "~/handlers/download/getS3Object";
import { extractFileInformation } from "~/handlers/download/extractFileInformation";
import { AccessControl } from "~/handlers/utils/AccessControl";
import { LambdaClient } from "~/handlers/utils/LambdaClient";
import { ApiGatewayLambdaClient } from "~/handlers/utils/ApiGatewayLambdaClient";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year
const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

const { region } = getEnvironment();
const s3 = new S3({ region });

const canUsePrivateFiles = (context: WcpContext) => {
    return context.wcp.canUseFeature("advancedAccessControlLayer");

    // // TODO: WCP feature is not yet enabled in our WCP!
    // const license = context.wcp.getProjectLicense();
    //
    // if (!license) {
    //     return false;
    // }
    //
    // const aacl = license.package.features.advancedAccessControlLayer;
    //
    // return aacl.enabled && aacl.options.privateFiles;
};

export const createDownloadFileByExactKeyPlugins = () => {
    const fnArn = String(process.env["MAIN_API_FUNCTION"]);
    const lambdaClient = new LambdaClient(fnArn);
    const apiGwLambdaClient = new ApiGatewayLambdaClient(lambdaClient);

    return [
        new RoutePlugin(({ onGet, context }) => {
            onGet("/files/*", async (request, reply) => {
                const fileInfo = extractFileInformation(request);
                // TODO: add metadata extraction to `getS3Object` utility
                const { params, object, metadata } = await getS3Object(fileInfo, s3, context);

                // TODO: get file metadata
                const headers = {
                    ...request.headers,
                    "x-tenant": metadata.tenant,
                    "x-i18n-locale": metadata.locale
                };

                if (canUsePrivateFiles(context as any as WcpContext)) {
                    const accessControl = new AccessControl(apiGwLambdaClient, headers);
                    const { canAccess } = await accessControl.canAccess(fileInfo.filename);

                    if (!canAccess) {
                        return reply
                            .code(403)
                            .headers({
                                "Content-Type": "application/json",
                                "Cache-Control": "no-cache, no-store, must-revalidate"
                            })
                            .send({ error: "You're not allowed to access this file!" });
                    }
                }

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
