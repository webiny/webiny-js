import path from "node:path";
import type { IHttpResponse } from "@webiny/event-handler-core";

export const getStoragePath = (): string => String(process.env.WEBINY_LOCAL_STORAGE_PATH);
export const getUploadSecret = (): string => String(process.env.WEBINY_UPLOAD_SECRET);

export const isPathContained = (filePath: string, storagePath: string): boolean => {
    const resolved = path.resolve(filePath);
    const root = path.resolve(storagePath);
    return resolved === root || resolved.startsWith(root + path.sep);
};

export const json = (statusCode: number, data: unknown): IHttpResponse => ({
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
});

/* Normalise a transport request body into a Buffer. */
export const toBuffer = (body: unknown): Buffer => {
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

export interface MultipartResult {
    fields: MultipartField[];
    files: MultipartFile[];
}

/* Minimal multipart/form-data parser operating on the raw body buffer. */
export const parseMultipart = (buffer: Buffer, boundary: string): MultipartResult => {
    const fields: MultipartField[] = [];
    const files: MultipartFile[] = [];
    const separator = Buffer.from(`--${boundary}`);

    let idx = buffer.indexOf(separator);
    while (idx !== -1) {
        const next = buffer.indexOf(separator, idx + separator.length);
        if (next === -1) {
            break;
        }

        let part = buffer.subarray(idx + separator.length, next);
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

export const getBoundary = (contentType: string): string | undefined => {
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    const value = match?.[1] ?? match?.[2];
    return value?.trim();
};
