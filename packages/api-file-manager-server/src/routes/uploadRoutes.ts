import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, rmdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { RoutePlugin } from "@webiny/handler/plugins/RoutePlugin.js";
import { ModifyFastifyPlugin } from "@webiny/handler/plugins/ModifyFastifyPlugin.js";
import { verifyUploadToken } from "~/utils/uploadToken.js";
import { getStoragePath, isValidUploadId, resolveTenantFilePath } from "~/utils/storagePaths.js";
import type { UploadTokenPayload } from "~/types.js";

const UPLOAD_PARTS_ROUTE = "/webiny-file-upload/parts";

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

class UploadRequestError extends Error {}

class FileTooLargeError extends Error {
    public constructor() {
        super("File exceeds maximum allowed size.");
    }
}

/**
 * Verifies the token of a single-file upload and returns the destination, which must be inside
 * the files folder of the tenant the token was issued for.
 */
const verifyFileUpload = (
    key: string | undefined,
    token: string | undefined
): { payload: UploadTokenPayload; destPath: string } => {
    if (!key || !token) {
        throw new UploadRequestError("Missing key or token.");
    }

    let payload: UploadTokenPayload;
    try {
        payload = verifyUploadToken(token, getUploadSecret());
    } catch (err) {
        throw new UploadRequestError(err instanceof Error ? err.message : "Invalid token.");
    }

    if (payload.key !== key) {
        throw new UploadRequestError("Token key mismatch.");
    }

    try {
        const destPath = resolveTenantFilePath(getStoragePath(), payload.tenantId, key);
        return { payload, destPath };
    } catch {
        throw new UploadRequestError("Invalid path.");
    }
};

/**
 * Verifies the token of a multipart chunk upload (all params are in the query string) and returns
 * the destination of the chunk.
 */
const verifyPartUpload = (query: Record<string, string | undefined>): string => {
    const uploadId = query["uploadId"];
    const partNumberStr = query["partNumber"];
    const token = query["token"];

    if (!uploadId || !partNumberStr || !token) {
        throw new UploadRequestError("Missing uploadId, partNumber, or token.");
    }

    if (!isValidUploadId(uploadId)) {
        throw new UploadRequestError("Invalid uploadId.");
    }

    const partNumber = parseInt(partNumberStr, 10);
    if (isNaN(partNumber) || partNumber < 1) {
        throw new UploadRequestError("Invalid partNumber.");
    }

    let payload: UploadTokenPayload;
    try {
        payload = verifyUploadToken(token, getUploadSecret());
    } catch (err) {
        throw new UploadRequestError(err instanceof Error ? err.message : "Invalid token.");
    }

    const expectedKey = `tenants/${payload.tenantId}/multipart/${uploadId}/part-${partNumber}`;

    if (payload.key !== expectedKey) {
        throw new UploadRequestError("Token key mismatch.");
    }

    const storagePath = getStoragePath();
    const destPath = path.join(storagePath, expectedKey);

    if (!isPathContained(destPath, storagePath)) {
        throw new UploadRequestError("Invalid path.");
    }

    return destPath;
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

    /**
     * Security: verify the chunk upload token (it is in the query string) before the body is read,
     * so unauthenticated requests cannot make the server buffer large bodies.
     */
    app.addHook("preParsing", async (request, reply, payload) => {
        if (request.method !== "PUT" || request.routeOptions.url !== UPLOAD_PARTS_ROUTE) {
            return payload;
        }
        try {
            verifyPartUpload(request.query as Record<string, string | undefined>);
        } catch (err) {
            if (err instanceof UploadRequestError) {
                return reply.code(400).send({ error: err.message });
            }
            throw err;
        }
        return payload;
    });
});

modifyFastifyPlugin.name = "fileManagerServer.modifyFastify";

export const uploadRoutesPlugin = new RoutePlugin(({ onPost, onPut }) => {
    /* POST /webiny-file-upload — simple single-file upload via multipart/form-data.
       Form fields: key (storage path), token (HMAC upload token).
       File field: the raw file bytes (any field name).
       The key and token fields must come before the file (same as an S3 presigned POST). */
    onPost("/webiny-file-upload", async (request, reply) => {
        let key: string | undefined;
        let token: string | undefined;
        let upload: { payload: UploadTokenPayload; destPath: string; tempPath: string } | undefined;
        let fileSize = 0;

        try {
            for await (const part of request.parts()) {
                if (part.type === "field") {
                    if (part.fieldname === "key") {
                        key = part.value as string;
                    } else if (part.fieldname === "token") {
                        token = part.value as string;
                    }
                    continue;
                }

                if (upload) {
                    throw new UploadRequestError("Only one file is allowed.");
                }

                // Security: verify the token before reading any file bytes.
                const { payload, destPath } = verifyFileUpload(key, token);
                const tempPath = `${destPath}.${randomUUID()}.upload`;
                upload = { payload, destPath, tempPath };

                await mkdir(path.dirname(destPath), { recursive: true });

                // Security: enforce the max file size while streaming, never buffer the file.
                const maxFileSize = payload.uploadMaxFileSize;
                await pipeline(
                    part.file,
                    async function* (source: AsyncIterable<Buffer>) {
                        for await (const chunk of source) {
                            fileSize += chunk.length;
                            if (maxFileSize > 0 && fileSize > maxFileSize) {
                                throw new FileTooLargeError();
                            }
                            yield chunk;
                        }
                    },
                    createWriteStream(tempPath, { flags: "wx" })
                );
            }

            if (!upload) {
                // Missing key/token is reported first, as before.
                verifyFileUpload(key, token);
                throw new UploadRequestError("No file in request.");
            }

            const { payload, destPath, tempPath } = upload;

            if (payload.uploadMinFileSize > 0 && fileSize < payload.uploadMinFileSize) {
                throw new UploadRequestError("File is below minimum allowed size.");
            }

            await rename(tempPath, destPath);
        } catch (err) {
            if (upload) {
                await rm(upload.tempPath, { force: true });
                // Remove the file folder if this upload created it, so the id can be used again.
                await rmdir(path.dirname(upload.destPath)).catch(() => undefined);
            }
            if (err instanceof UploadRequestError || err instanceof FileTooLargeError) {
                return reply.code(400).send({ error: err.message });
            }
            throw err;
        }

        return reply.code(204).send();
    });

    /* PUT /webiny-file-upload/parts — multipart chunk upload via raw binary body.
       Query params: uploadId, partNumber, token.
       Body: raw binary chunk (application/octet-stream). */
    onPut(UPLOAD_PARTS_ROUTE, async (request, reply) => {
        let destPath: string;
        try {
            destPath = verifyPartUpload(request.query as Record<string, string | undefined>);
        } catch (err) {
            if (err instanceof UploadRequestError) {
                return reply.code(400).send({ error: err.message });
            }
            throw err;
        }

        const destDir = path.dirname(destPath);
        await mkdir(destDir, { recursive: true });

        const body = request.body as Buffer;

        await writeFile(destPath, body);

        const etag = createHash("md5").update(body).digest("hex");

        return reply.code(200).header("ETag", etag).send();
    });
});

uploadRoutesPlugin.name = "fileManagerServer.uploadRoutes";
