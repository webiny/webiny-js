import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createUploadToken } from "~/utils/uploadToken.js";
import { UploadSingleFileRoute } from "~/routes/UploadSingleFileRoute/UploadSingleFileRoute.js";
import { UploadPartRoute } from "~/routes/UploadPartRoute/UploadPartRoute.js";
import {
    cleanupStorage,
    makeUploadRequest,
    SECRET,
    setupStorage,
    TENANT_ID
} from "./utils/helpers.js";

let storagePath: string;

beforeEach(async () => {
    storagePath = await setupStorage();
});

afterEach(async () => {
    await cleanupStorage();
});

describe("single file upload route", () => {
    it("should upload a file to disk", async () => {
        const route = new UploadSingleFileRoute();
        const fileContent = Buffer.from("hello webiny");
        const storageKey = `tenants/${TENANT_ID}/files/abc123/test.txt`;

        const request = makeUploadRequest({
            storageKey,
            fileContent,
            filename: "test.txt"
        });

        const response = await route.handle(request);

        expect(response.statusCode).toBe(204);

        const written = await fs.readFile(path.join(storagePath, storageKey));
        expect(written.toString()).toBe("hello webiny");
    });

    it("should reject upload with expired token", async () => {
        const route = new UploadSingleFileRoute();
        const storageKey = `tenants/${TENANT_ID}/files/abc/file.txt`;

        const request = makeUploadRequest({
            storageKey,
            fileContent: Buffer.from("data"),
            filename: "file.txt",
            tokenOverrides: { expiresAt: Date.now() - 1000 }
        });

        const response = await route.handle(request);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Token has expired.");
    });

    it("should reject file exceeding max size", async () => {
        const route = new UploadSingleFileRoute();
        const storageKey = `tenants/${TENANT_ID}/files/abc/big.txt`;

        const request = makeUploadRequest({
            storageKey,
            fileContent: Buffer.from("this is too large"),
            filename: "big.txt",
            tokenOverrides: { uploadMaxFileSize: 5 }
        });

        const response = await route.handle(request);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("File exceeds maximum allowed size.");
    });

    it("should reject request with missing file", async () => {
        const route = new UploadSingleFileRoute();
        const storageKey = `tenants/${TENANT_ID}/files/abc/missing.txt`;
        const boundary = "----TestBoundary123";

        const token = createUploadToken(
            {
                key: storageKey,
                tenantId: TENANT_ID,
                expiresAt: Date.now() + 60_000,
                uploadMinFileSize: 0,
                uploadMaxFileSize: 1_099_511_627_776
            },
            SECRET
        );

        const body = Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n${storageKey}\r\n` +
                `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n` +
                `--${boundary}--\r\n`
        );

        const response = await route.handle({
            method: "POST",
            path: "/webiny-file-upload",
            headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
            query: {},
            pathParameters: {},
            body
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("No file in request.");
    });

    it("should reject token/key mismatch", async () => {
        const route = new UploadSingleFileRoute();
        const storageKey = `tenants/${TENANT_ID}/files/abc/file.txt`;

        const request = makeUploadRequest({
            storageKey,
            fileContent: Buffer.from("data"),
            filename: "file.txt",
            tokenOverrides: { key: "tenants/t1/files/OTHER/file.txt" }
        });

        const response = await route.handle(request);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Token key mismatch.");
    });
});

describe("part upload route", () => {
    it("should upload a part to disk and return etag", async () => {
        const route = new UploadPartRoute();
        const uploadId = "upload-001";
        const partNumber = 1;
        const partData = Buffer.from("part one data");
        const expectedKey = `tenants/${TENANT_ID}/multipart/${uploadId}/part-${partNumber}`;

        const token = createUploadToken(
            {
                key: expectedKey,
                tenantId: TENANT_ID,
                expiresAt: Date.now() + 60_000,
                uploadMinFileSize: 0,
                uploadMaxFileSize: 1_099_511_627_776
            },
            SECRET
        );

        const response = await route.handle({
            method: "PUT",
            path: "/webiny-file-upload/parts",
            headers: {},
            query: {
                uploadId,
                partNumber: String(partNumber),
                token
            },
            pathParameters: {},
            body: partData
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers?.ETag).toBeDefined();

        const written = await fs.readFile(path.join(storagePath, expectedKey));
        expect(written.toString()).toBe("part one data");
    });
});
