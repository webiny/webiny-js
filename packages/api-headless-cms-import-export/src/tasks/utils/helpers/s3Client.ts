import { NodeHttpHandler } from "@smithy/node-http-handler";
import type { S3Client, S3ClientConfig } from "@webiny/aws-sdk/client-s3";
import { createS3Client as baseCreateS3Client } from "@webiny/aws-sdk/client-s3";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

export type { S3Client };

export const createS3Client = (params?: S3ClientConfig): S3Client => {
    return baseCreateS3Client({
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 0,
            socketTimeout: 0,
            requestTimeout: 0,
            httpAgent: new HttpAgent({
                maxSockets: Infinity,
                keepAlive: true,
                maxFreeSockets: Infinity,
                maxTotalSockets: Infinity,
                keepAliveMsecs: 900000 // milliseconds / 15 minutes
            }),
            httpsAgent: new HttpsAgent({
                maxSockets: Infinity,
                keepAlive: true,
                sessionTimeout: 900, // seconds / 15 minutes
                maxCachedSessions: 100000,
                maxFreeSockets: Infinity,
                maxTotalSockets: Infinity,
                keepAliveMsecs: 900000 // milliseconds / 15 minutes
            })
        }),
        ...params
    });
};
