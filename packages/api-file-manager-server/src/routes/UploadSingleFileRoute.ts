import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import {
    getStoragePath,
    getUploadSecret,
    isPathContained,
    json,
    toBuffer,
    parseMultipart,
    getBoundary
} from "./utils.js";

class UploadSingleFileRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/webiny-file-upload";

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const storagePath = getStoragePath();
        const secret = getUploadSecret();

        const contentType =
            request.headers["content-type"] ?? request.headers["Content-Type"] ?? "";
        const boundary = getBoundary(contentType);
        if (!boundary) {
            return json(400, { error: "Expected multipart/form-data with a boundary." });
        }

        const { fields, files } = parseMultipart(toBuffer(request.body), boundary);
        const key = fields.find(field => field.name === "key")?.value;
        const token = fields.find(field => field.name === "token")?.value;
        const file = files[0];

        if (!key || !token) {
            return json(400, { error: "Missing key or token." });
        }

        if (!file) {
            return json(400, { error: "No file in request." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return json(400, { error: err instanceof Error ? err.message : "Invalid token." });
        }

        if (payload.key !== key) {
            return json(400, { error: "Token key mismatch." });
        }

        const fileSize = file.data.length;
        if (payload.uploadMaxFileSize > 0 && fileSize > payload.uploadMaxFileSize) {
            return json(400, { error: "File exceeds maximum allowed size." });
        }

        if (payload.uploadMinFileSize > 0 && fileSize < payload.uploadMinFileSize) {
            return json(400, { error: "File is below minimum allowed size." });
        }

        const destPath = path.join(storagePath, key);
        if (!isPathContained(destPath, storagePath)) {
            return json(400, { error: "Invalid path." });
        }

        await mkdir(path.dirname(destPath), { recursive: true });
        await writeFile(destPath, file.data);

        return { statusCode: 204 };
    }
}

export const UploadSingleFileRoute = HttpRoute.createImplementation({
    implementation: UploadSingleFileRouteImpl,
    dependencies: []
});
