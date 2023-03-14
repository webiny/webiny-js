import S3 from "aws-sdk/clients/s3";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getEnvironment } from "../utils";
import { RoutePlugin } from "@webiny/handler-aws/gateway";
import { extractFileInformation } from "./extractFileInformation";
import { getS3Object } from "./getS3Object";

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year
const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

export interface DownloadByFileAliasConfig {
    documentClient: DocumentClient;
}

export const createDownloadFileByAliasPlugins = ({ documentClient }: DownloadByFileAliasConfig) => {
    async function getFileByAlias(tenant: string, alias: string): Promise<string | null> {
        const { Items, Count } = await documentClient
            .query({
                TableName: String(process.env.DB_TABLE),
                IndexName: "GSI1",
                Limit: 1,
                KeyConditionExpression: "GSI1_PK = :GSI1_PK AND GSI1_SK = :GSI1_SK",
                ExpressionAttributeValues: {
                    ":GSI1_PK": `T#${tenant}#FM#FILE_ALIASES`,
                    ":GSI1_SK": `/${alias}`
                }
            })
            .promise();

        if (!Items || Count === 0) {
            return null;
        }

        return Items[0].data.key ?? null;
    }

    return [
        new RoutePlugin(({ onGet, context }) => {
            onGet("/*", async (request, reply) => {
                const { region } = getEnvironment();
                const fileInfo = extractFileInformation(request);

                // TODO: `root` tenant is hardcoded for now, to satisfy the basic use case.
                // We need to find a way to send tenant via `x-tenant` header, when images are being requested from
                // the frontend (website, admin, etc.) by alias.
                const realFilename = await getFileByAlias("root", fileInfo.filename);

                if (!realFilename) {
                    return reply.code(404).type("text/html").send("Not Found");
                }

                const s3 = new S3({ region });
                const { params, object } = await getS3Object(
                    { ...fileInfo, filename: realFilename },
                    s3,
                    context
                );

                // If there's an "object", it means we can return its body directly.
                if (object) {
                    return reply
                        .headers({
                            "Content-Type": object.ContentType,
                            "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`,
                            "x-webiny-base64-encoded": true
                        })
                        .send(object.Body || "");
                }

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
