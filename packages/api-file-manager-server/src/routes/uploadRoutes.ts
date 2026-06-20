import path from "node:path";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { RoutePlugin } from "@webiny/handler/plugins/RoutePlugin.js";
import { ModifyFastifyPlugin } from "@webiny/handler/plugins/ModifyFastifyPlugin.js";
import { verifyUploadToken } from "~/utils/uploadToken.js";

const getStoragePath = (): string => {
    return String(process.env.WEBINY_LOCAL_STORAGE_PATH);
};

const getUploadSecret = (): string => {
    return String(process.env.WEBINY_UPLOAD_SECRET);
};

const isPathContained = (filePath: string, storagePath: string): boolean => {
    const resolved = path.resolve(filePath);
    const root = path.resolve(storagePath);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
        return false;
    }
    return true;
};

export const modifyFastifyPlugin = new ModifyFastifyPlugin(app => {
    app.register(import("@fastify/multipart"), {
        limits: {
            fileSize: 5 * 1024 * 1024 * 1024 /* 5 GB */
        }
    });

    app.addContentTypeParser(
        "application/octet-stream",
        { parseAs: "buffer" },
        (_request, body, done) => {
            done(null, body);
        }
    );
});

modifyFastifyPlugin.name = "fileManagerServer.modifyFastify";

export const uploadRoutesPlugin = new RoutePlugin(({ onPost, onPut }) => {
    /* POST /webiny-file-upload — simple single-file upload via multipart/form-data.
       Form fields: key (storage path), token (HMAC upload token).
       File field: the raw file bytes (any field name). */
    onPost("/webiny-file-upload", async (request, reply) => {
        const storagePath = getStoragePath();
        const secret = getUploadSecret();

        let key: string | undefined;
        let token: string | undefined;
        let fileChunks: Buffer[] | undefined;
        let fileSize = 0;

        const parts = request.parts();

        for await (const part of parts) {
            if (part.type === "field") {
                if (part.fieldname === "key") {
                    key = part.value as string;
                } else if (part.fieldname === "token") {
                    token = part.value as string;
                }
            } else if (part.type === "file") {
                /* Collect the file stream into memory so we can measure and hash it. */
                const chunks: Buffer[] = [];
                for await (const chunk of part.file) {
                    chunks.push(chunk as Buffer);
                    fileSize += (chunk as Buffer).length;
                }
                fileChunks = chunks;
            }
        }

        if (!key || !token) {
            return reply.code(400).send({ error: "Missing key or token." });
        }

        if (!fileChunks) {
            return reply.code(400).send({ error: "No file in request." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return reply
                .code(400)
                .send({ error: err instanceof Error ? err.message : "Invalid token." });
        }

        if (payload.key !== key) {
            return reply.code(400).send({ error: "Token key mismatch." });
        }

        if (payload.uploadMaxFileSize > 0 && fileSize > payload.uploadMaxFileSize) {
            return reply.code(400).send({ error: "File exceeds maximum allowed size." });
        }

        if (payload.uploadMinFileSize > 0 && fileSize < payload.uploadMinFileSize) {
            return reply.code(400).send({ error: "File is below minimum allowed size." });
        }

        const destPath = path.join(storagePath, key);

        if (!isPathContained(destPath, storagePath)) {
            return reply.code(400).send({ error: "Invalid path." });
        }

        const destDir = path.dirname(destPath);
        await mkdir(destDir, { recursive: true });

        const writeStream = createWriteStream(destPath);
        const readable = Readable.from(fileChunks);

        await pipeline(readable, writeStream);

        return reply.code(204).send();
    });

    /* PUT /webiny-file-upload/parts — multipart chunk upload via raw binary body.
       Query params: uploadId, partNumber, token.
       Body: raw binary chunk (application/octet-stream). */
    onPut("/webiny-file-upload/parts", async (request, reply) => {
        const storagePath = getStoragePath();
        const secret = getUploadSecret();

        const query = request.query as Record<string, string | undefined>;
        const uploadId = query["uploadId"];
        const partNumberStr = query["partNumber"];
        const token = query["token"];

        if (!uploadId || !partNumberStr || !token) {
            return reply.code(400).send({ error: "Missing uploadId, partNumber, or token." });
        }

        const partNumber = parseInt(partNumberStr, 10);
        if (isNaN(partNumber) || partNumber < 1) {
            return reply.code(400).send({ error: "Invalid partNumber." });
        }

        let payload;
        try {
            payload = verifyUploadToken(token, secret);
        } catch (err) {
            return reply
                .code(400)
                .send({ error: err instanceof Error ? err.message : "Invalid token." });
        }

        const expectedKey = `tenants/${payload.tenantId}/multipart/${uploadId}/part-${partNumber}`;

        if (payload.key !== expectedKey) {
            return reply.code(400).send({ error: "Token key mismatch." });
        }

        const destPath = path.join(storagePath, expectedKey);

        if (!isPathContained(destPath, storagePath)) {
            return reply.code(400).send({ error: "Invalid path." });
        }

        const destDir = path.dirname(destPath);
        await mkdir(destDir, { recursive: true });

        const body = request.body as Buffer;

        const writeStream = createWriteStream(destPath);
        const readable = Readable.from(body);

        await pipeline(readable, writeStream);

        const etag = createHash("md5").update(body).digest("hex");

        return reply.code(200).header("ETag", etag).send();
    });
});

uploadRoutesPlugin.name = "fileManagerServer.uploadRoutes";
