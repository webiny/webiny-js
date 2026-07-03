import path from "node:path";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { verifyUploadToken } from "~/utils/uploadToken.js";

/*
 * Self-hosted file upload HTTP routes, migrated from the Fastify RoutePlugin/ModifyFastifyPlugin
 * mechanism to the transport-agnostic HttpRoute abstraction (@webiny/event-handler-core).
 *
 * NOTE (runtime follow-up): API Gateway/Lambda deliver binary request bodies base64-encoded via
 * `isBase64Encoded`. The current AWS transport (apiGatewayEventToHttpRequest) passes the raw body
 * through as a string without decoding that flag, so `toBuffer()` below decodes defensively. Full
 * end-to-end self-hosted uploads additionally require the transport to honor `isBase64Encoded` for
 * request bodies — tracked as a follow-up. These routes are wired and unit-safe, but the binary
 * upload path is not yet exercised end-to-end on this branch.
 */

const getStoragePath = (): string => String(process.env.WEBINY_LOCAL_STORAGE_PATH);
const getUploadSecret = (): string => String(process.env.WEBINY_UPLOAD_SECRET);

const isPathContained = (filePath: string, storagePath: string): boolean => {
    const resolved = path.resolve(filePath);
    const root = path.resolve(storagePath);
    return resolved === root || resolved.startsWith(root + path.sep);
};

const json = (statusCode: number, data: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
});

/* Normalise a transport request body into a Buffer (see NOTE above). */
const toBuffer = (body: unknown): Buffer => {
    if (Buffer.isBuffer(body)) {
        return body;
    }
    if (body instanceof Uint8Array) {
        return Buffer.from(body);
    }
    if (typeof body === "string") {
        return Buffer.from(body, "base64");
    }
    return Buffer.alloc(0);
};

interface MultipartField {
    name: string;
    value: string;
}

interface MultipartFile {
    name: string;
    filename: string;
    data: Buffer;
}

/* Minimal multipart/form-data parser operating on the raw body buffer. */
const parseMultipart = (
    buffer: Buffer,
    boundary: string
): { fields: MultipartField[]; files: MultipartFile[] } => {
    const fields: MultipartField[] = [];
    const files: MultipartFile[] = [];
    const separator = Buffer.from(`--${boundary}`);

    let idx = buffer.indexOf(separator);
    while (idx !== -1) {
        const next = buffer.indexOf(separator, idx + separator.length);
        if (next === -1) {
            /* Reached the closing boundary (`--boundary--`); nothing more to parse. */
            break;
        }

        let part = buffer.subarray(idx + separator.length, next);
        /* Strip the CRLF right after the boundary and the trailing CRLF before the next one. */
        if (part.subarray(0, 2).toString("latin1") === "\r\n") {
            part = part.subarray(2);
        }
        if (part.subarray(-2).toString("latin1") === "\r\n") {
            part = part.subarray(0, -2);
        }

        const headerEnd = part.indexOf("\r\n\r\n");
        if (headerEnd !== -1) {
            const rawHeaders = part.subarray(0, headerEnd).toString("utf8");
            const content = part.subarray(headerEnd + 4);

            const disposition = /content-disposition:[^\r\n]*/i.exec(rawHeaders)?.[0] ?? "";
            const name = /name="([^"]*)"/i.exec(disposition)?.[1];
            const filename = /filename="([^"]*)"/i.exec(disposition)?.[1];

            if (name !== undefined) {
                if (filename !== undefined) {
                    files.push({ name, filename, data: content });
                } else {
                    fields.push({ name, value: content.toString("utf8") });
                }
            }
        }

        idx = next;
    }

    return { fields, files };
};

const getBoundary = (contentType: string): string | undefined => {
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    const value = match?.[1] ?? match?.[2];
    return value?.trim();
};

/*
 * POST /webiny-file-upload — simple single-file upload via multipart/form-data.
 * Form fields: key (storage path), token (HMAC upload token). File field: the raw file bytes.
 */
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

/*
 * PUT /webiny-file-upload/parts — multipart chunk upload via raw binary body.
 * Query params: uploadId, partNumber, token. Body: raw binary chunk.
 */
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
