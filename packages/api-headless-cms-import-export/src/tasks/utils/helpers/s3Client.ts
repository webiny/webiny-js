import { NodeHttpHandler } from "@smithy/node-http-handler";
import { createS3Client as baseCreateS3Client, S3Client } from "@webiny/aws-sdk/client-s3";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

export type { S3Client };

export const createS3Client = (): S3Client => {
    return baseCreateS3Client({
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 0,
            httpAgent: new HttpAgent({
                maxSockets: 10000,
                keepAlive: true,
                maxFreeSockets: 10000,
                maxTotalSockets: 10000,
                keepAliveMsecs: 900000 // milliseconds / 15 minutes
            }),
            httpsAgent: new HttpsAgent({
                maxSockets: 10000,
                keepAlive: true,
                sessionTimeout: 900, // seconds / 15 minutes
                maxCachedSessions: 100000,
                maxFreeSockets: 10000,
                maxTotalSockets: 10000,
                keepAliveMsecs: 900000 // milliseconds / 15 minutes
            }),
            requestTimeout: 900000 // milliseconds / 15 minutes
        })
    });
};
