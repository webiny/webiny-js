import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { modifyFastifyPlugin, uploadRoutesPlugin } from "~/routes/uploadRoutes.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import type { UploadTokenPayload } from "~/types.js";

const SECRET = "test-secret";
const BOUNDARY = "----webinytestboundary";
const UPLOAD_ID = "65f1a2b3c4d5e6f708192a3b";

const token = (overrides: Partial<UploadTokenPayload> = {}) => {
    return createUploadToken(
        {
            key: "tenants/root/files/abc/a.txt",
            tenantId: "root",
            expiresAt: Date.now() + 60_000,
            uploadMinFileSize: 0,
            uploadMaxFileSize: 100,
            ...overrides
        },
        SECRET
    );
};

const multipartBody = (fields: Array<[string, string]>, file?: string, fileFirst = false) => {
    const parts: string[] = [];
    const filePart = `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\n${file}\r\n`;
    if (file !== undefined && fileFirst) {
        parts.push(filePart);
    }
    for (const [name, value] of fields) {
        parts.push(
            `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
        );
    }
    if (file !== undefined && !fileFirst) {
        parts.push(filePart);
    }
    parts.push(`--${BOUNDARY}--\r\n`);
    return parts.join("");
};

describe("upload routes", () => {
    let storagePath: string;
    let app: FastifyInstance;
    const env = { ...process.env };

    const post = (body: string) => {
        return app.inject({
            method: "POST",
            url: "/webiny-file-upload",
            headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
            payload: body
        });
    };

    const listFiles = async (dir: string): Promise<string[]> => {
        try {
            return await readdir(dir, { recursive: true });
        } catch {
            return [];
        }
    };

    beforeEach(async () => {
        storagePath = await mkdtemp(path.join(os.tmpdir(), "fm-server-routes-"));
        process.env.WEBINY_LOCAL_STORAGE_PATH = storagePath;
        process.env.WEBINY_UPLOAD_SECRET = SECRET;

        app = Fastify();
        modifyFastifyPlugin.modify(app);
        uploadRoutesPlugin.cb({
            onPost: (p: string, h: any) => app.post(p, h),
            onPut: (p: string, h: any) => app.put(p, h)
        } as any);
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
        await rm(storagePath, { recursive: true, force: true });
        process.env = { ...env };
    });

    it("should store an uploaded file", async () => {
        const key = "tenants/root/files/abc/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", token()]
                ],
                "hello"
            )
        );
        expect(response.statusCode).toBe(204);
        expect(await readFile(path.join(storagePath, key), "utf-8")).toBe("hello");
        expect(await listFiles(path.join(storagePath, "tenants/root/files/abc"))).toEqual([
            "a.txt"
        ]);
    });

    it("should refuse a destination outside the token tenant files folder", async () => {
        const key = "tenants/other/files/victim/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", token({ key })]
                ],
                "hello"
            )
        );
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "Invalid path." });

        const traversal = "tenants/root/files/../../other/files/victim/a.txt";
        const response2 = await post(
            multipartBody(
                [
                    ["key", traversal],
                    ["token", token({ key: traversal })]
                ],
                "hello"
            )
        );
        expect(response2.statusCode).toBe(400);
        expect(await listFiles(path.join(storagePath, "tenants"))).toEqual([]);
    });

    it("should refuse a file sent before the token", async () => {
        const key = "tenants/root/files/abc/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", token()]
                ],
                "hello",
                true
            )
        );
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "Missing key or token." });
        expect(await listFiles(path.join(storagePath, "tenants"))).toEqual([]);
    });

    it("should refuse an invalid token", async () => {
        const key = "tenants/root/files/abc/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", "x.y"]
                ],
                "hello"
            )
        );
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "Invalid token signature." });
    });

    it("should refuse a file over the max size and keep nothing on disk", async () => {
        const key = "tenants/root/files/abc/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", token()]
                ],
                "x".repeat(101)
            )
        );
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "File exceeds maximum allowed size." });
        expect(await listFiles(path.join(storagePath, "tenants/root/files"))).toEqual([]);
    });

    it("should refuse a file below the min size", async () => {
        const key = "tenants/root/files/abc/a.txt";
        const response = await post(
            multipartBody(
                [
                    ["key", key],
                    ["token", token({ uploadMinFileSize: 10 })]
                ],
                "short"
            )
        );
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "File is below minimum allowed size." });
        expect(await listFiles(path.join(storagePath, "tenants/root/files"))).toEqual([]);
    });

    it("should verify the part token before reading the body", async () => {
        const partKey = `tenants/root/multipart/${UPLOAD_ID}/part-1`;
        const put = (query: string) => {
            return app.inject({
                method: "PUT",
                url: `/webiny-file-upload/parts?${query}`,
                headers: { "content-type": "application/octet-stream" },
                payload: Buffer.from("chunk")
            });
        };

        const invalid = await put(`uploadId=${UPLOAD_ID}&partNumber=1&token=x.y`);
        expect(invalid.statusCode).toBe(400);
        expect(invalid.json()).toEqual({ error: "Invalid token signature." });

        // Over the 1 MB default body limit: a 413 would mean the body was read before the check.
        const large = await app.inject({
            method: "PUT",
            url: `/webiny-file-upload/parts?uploadId=${UPLOAD_ID}&partNumber=1&token=x.y`,
            headers: { "content-type": "application/octet-stream" },
            payload: Buffer.alloc(2 * 1024 * 1024)
        });
        expect(large.statusCode).toBe(400);
        expect(large.json()).toEqual({ error: "Invalid token signature." });

        const badId = await put(`uploadId=.&partNumber=1&token=${token({ key: partKey })}`);
        expect(badId.statusCode).toBe(400);
        expect(badId.json()).toEqual({ error: "Invalid uploadId." });

        const valid = await put(
            `uploadId=${UPLOAD_ID}&partNumber=1&token=${token({ key: partKey })}`
        );
        expect(valid.statusCode).toBe(200);
        expect(await readFile(path.join(storagePath, partKey), "utf-8")).toBe("chunk");
    });
});
