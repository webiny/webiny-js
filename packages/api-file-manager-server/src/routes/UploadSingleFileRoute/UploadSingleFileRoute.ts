import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { HttpRoute } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";
import { isPathContained, toBuffer, parseMultipart, getBoundary } from "../utils.js";

class UploadSingleFileRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/webiny-file-upload";

    public constructor(private readonly config: FileManagerServerConfig.Interface) {}

    public async handle(request: HttpRoute.Request, response: HttpRoute.Response) {
        const storagePath = this.config.storagePath;
        const secret = this.config.uploadSecret;

        const contentType =
            request.headers["content-type"] ?? request.headers["Content-Type"] ?? "";
        const boundary = getBoundary(contentType);
        if (!boundary) {
            return response
                .status(400)
                .json({ error: "Expected multipart/form-data with a boundary." });
        }

        const { fields, files } = parseMultipart(toBuffer(request.body), boundary);
        const key = fields.find(field => field.name === "key")?.value;
        const token = fields.find(field => field.name === "token")?.value;
        const file = files[0];

        if (!key || !token) {
            return response.status(400).json({ error: "Missing key or token." });
        }

        if (!file) {
            return response.status(400).json({ error: "No file in request." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return response
                .status(400)
                .json({ error: err instanceof Error ? err.message : "Invalid token." });
        }

        if (payload.key !== key) {
            return response.status(400).json({ error: "Token key mismatch." });
        }

        const fileSize = file.data.length;
        if (payload.uploadMaxFileSize > 0 && fileSize > payload.uploadMaxFileSize) {
            return response.status(400).json({ error: "File exceeds maximum allowed size." });
        }

        if (payload.uploadMinFileSize > 0 && fileSize < payload.uploadMinFileSize) {
            return response.status(400).json({ error: "File is below minimum allowed size." });
        }

        const destPath = path.join(storagePath, key);
        if (!isPathContained(destPath, storagePath)) {
            return response.status(400).json({ error: "Invalid path." });
        }

        await mkdir(path.dirname(destPath), { recursive: true });
        await writeFile(destPath, file.data);

        return response.status(204);
    }
}

export const UploadSingleFileRoute = HttpRoute.createImplementation({
    implementation: UploadSingleFileRouteImpl,
    dependencies: [FileManagerServerConfig]
});
