/**
 * AWS example: serve files from S3.
 *
 * The handler just returns a Buffer — ApiGatewayAdapter detects it
 * and sets isBase64Encoded: true automatically. No AWS-specific
 * logic leaks into the handler.
 */

import { S3Client, GetObjectCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { HttpRoute } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";

const s3 = new S3Client({});
const BUCKET = "my-bucket";

class FilesHandlerImpl implements HttpRoute.Interface {
    private matches(event: any): boolean {
        return event?.method === "GET" && event?.path?.startsWith("/files");
    }

    async execute(event: any, next: NextFunction) {
        if (!this.matches(event)) {
            return next();
        }

        const key = (event.path as string).replace("/files/", "");
        const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
        const body = Buffer.from(await response.Body!.transformToByteArray());

        return {
            statusCode: 200,
            headers: { "Content-Type": response.ContentType || "application/octet-stream" },
            body // Buffer → adapter sets isBase64Encoded: true
        };
    }
}

export const filesHandler = CloudHandler.createImplementation({
    implementation: FilesHandlerImpl,
    dependencies: []
});
