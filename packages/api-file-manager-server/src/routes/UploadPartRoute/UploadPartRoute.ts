import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";
import { isPathContained, toBuffer } from "../utils.js";

class UploadPartRouteImpl implements HttpRoute.Interface {
    public readonly method = "PUT";
    public readonly path = "/webiny-file-upload/parts";

    public constructor(private readonly config: FileManagerServerConfig.Interface) {}

    public async handle(request: IHttpRequest, response: IHttpResponseBuilder) {
        const storagePath = this.config.storagePath;
        const secret = this.config.uploadSecret;

        const query = request.query ?? {};
        const uploadId = query["uploadId"];
        const partNumberStr = query["partNumber"];
        const token = query["token"];

        if (!uploadId || !partNumberStr || !token) {
            return response.status(400).json({ error: "Missing uploadId, partNumber, or token." });
        }

        const partNumber = parseInt(partNumberStr, 10);
        if (isNaN(partNumber) || partNumber < 1) {
            return response.status(400).json({ error: "Invalid partNumber." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return response
                .status(400)
                .json({ error: err instanceof Error ? err.message : "Invalid token." });
        }

        const expectedKey = `tenants/${payload.tenantId}/multipart/${uploadId}/part-${partNumber}`;
        if (payload.key !== expectedKey) {
            return response.status(400).json({ error: "Token key mismatch." });
        }

        const destPath = path.join(storagePath, expectedKey);
        if (!isPathContained(destPath, storagePath)) {
            return response.status(400).json({ error: "Invalid path." });
        }

        await mkdir(path.dirname(destPath), { recursive: true });

        const body = toBuffer(request.body);
        await writeFile(destPath, body);

        const etag = createHash("md5").update(body).digest("hex");

        return response.header("etag", etag);
    }
}

export const UploadPartRoute = HttpRoute.createImplementation({
    implementation: UploadPartRouteImpl,
    dependencies: [FileManagerServerConfig]
});
