import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { getStoragePath, getUploadSecret, isPathContained, json, toBuffer } from "./utils.js";

class UploadPartRouteImpl implements HttpRoute.Interface {
    public readonly method = "PUT";
    public readonly path = "/webiny-file-upload/parts";

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const storagePath = getStoragePath();
        const secret = getUploadSecret();

        const query = request.query ?? {};
        const uploadId = query["uploadId"];
        const partNumberStr = query["partNumber"];
        const token = query["token"];

        if (!uploadId || !partNumberStr || !token) {
            return json(400, { error: "Missing uploadId, partNumber, or token." });
        }

        const partNumber = parseInt(partNumberStr, 10);
        if (isNaN(partNumber) || partNumber < 1) {
            return json(400, { error: "Invalid partNumber." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return json(400, { error: err instanceof Error ? err.message : "Invalid token." });
        }

        const expectedKey = `tenants/${payload.tenantId}/multipart/${uploadId}/part-${partNumber}`;
        if (payload.key !== expectedKey) {
            return json(400, { error: "Token key mismatch." });
        }

        const destPath = path.join(storagePath, expectedKey);
        if (!isPathContained(destPath, storagePath)) {
            return json(400, { error: "Invalid path." });
        }

        await mkdir(path.dirname(destPath), { recursive: true });

        const body = toBuffer(request.body);
        await writeFile(destPath, body);

        const etag = createHash("md5").update(body).digest("hex");

        return { statusCode: 200, headers: { ETag: etag } };
    }
}

export const UploadPartRoute = HttpRoute.createImplementation({
    implementation: UploadPartRouteImpl,
    dependencies: []
});
