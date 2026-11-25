import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { invokeHttpRoute } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";
import { createUploadToken } from "~/utils/uploadToken.js";
import { UploadSingleFileRoute } from "~/routes/UploadSingleFileRoute/UploadSingleFileRoute.js";
import { UploadFileUseCase } from "~/features/UploadFile/UploadFileUseCase.js";
import { UploadPartRoute } from "~/routes/UploadPartRoute/UploadPartRoute.js";
import { UploadPartUseCase } from "~/features/UploadPart/UploadPartUseCase.js";
import type { UploadTokenPayload } from "~/types.js";
import { makeUploadRequest } from "./utils/helpers.js";
import { SECRET } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";
import { storageBackends } from "./utils/storageBackends.js";

const makePartRequest = (
    payload: Partial<UploadTokenPayload>,
    query: Record<string, string>,
    body: Buffer
): IHttpRequest => {
    const token = createUploadToken(
        {
            key: `tenants/${TENANT_ID}/files/abc/big.bin`,
            tenantId: TENANT_ID,
            expiresAt: Date.now() + 60_000,
            uploadMinFileSize: 0,
            uploadMaxFileSize: 1_099_511_627_776,
            ...payload
        },
        SECRET
    );
    return {
        method: "PUT",
        path: "/webiny-file-upload/parts",
        headers: {},
        query: { ...query, token },
        pathParameters: {},
        body
    };
};

describe.each(storageBackends)("upload routes: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    describe("single file upload route", () => {
        it("should store the uploaded file", async () => {
            const storage = backend.storage();
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), storage)
            );
            const storageKey = `tenants/${TENANT_ID}/files/abc123/test.txt`;
            const request = makeUploadRequest({
                storageKey,
                fileContent: Buffer.from("hello webiny"),
                filename: "test.txt"
            });

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(204);
            const written = await storage.get(storageKey);
            expect(written?.toString()).toBe("hello webiny");
        });

        it("should reject upload with expired token", async () => {
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), backend.storage())
            );
            const request = makeUploadRequest({
                storageKey: `tenants/${TENANT_ID}/files/abc/file.txt`,
                fileContent: Buffer.from("data"),
                filename: "file.txt",
                tokenOverrides: { expiresAt: Date.now() - 1000 }
            });

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Token has expired.");
        });

        it("should reject file exceeding max size", async () => {
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), backend.storage())
            );
            const request = makeUploadRequest({
                storageKey: `tenants/${TENANT_ID}/files/abc/big.txt`,
                fileContent: Buffer.from("this is too large"),
                filename: "big.txt",
                tokenOverrides: { uploadMaxFileSize: 5 }
            });

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("File exceeds maximum allowed size.");
        });

        it("should reject request with missing file", async () => {
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), backend.storage())
            );
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

            const response = await invokeHttpRoute(route, {
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
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), backend.storage())
            );
            const request = makeUploadRequest({
                storageKey: `tenants/${TENANT_ID}/files/abc/file.txt`,
                fileContent: Buffer.from("data"),
                filename: "file.txt",
                tokenOverrides: { key: "tenants/t1/files/OTHER/file.txt" }
            });

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Token key mismatch.");
        });

        it("should reject a token issued for one part of a multipart upload", async () => {
            const storageKey = `tenants/${TENANT_ID}/files/abc/file.txt`;
            const route = new UploadSingleFileRoute(
                new UploadFileUseCase(backend.config(), backend.storage())
            );
            const request = makeUploadRequest({
                storageKey,
                fileContent: Buffer.from("data"),
                filename: "file.txt",
                tokenOverrides: { multipart: { uploadId: "u1", partNumber: 1 } }
            });

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Token key mismatch.");
        });
    });

    describe("part upload route", () => {
        it("should store a part and return its etag", async () => {
            const storage = backend.storage();
            const key = `tenants/${TENANT_ID}/files/abc/big.bin`;
            const uploadId = await storage.createMultipartUpload(key);
            const route = new UploadPartRoute(new UploadPartUseCase(backend.config(), storage));
            const request = makePartRequest(
                { key, multipart: { uploadId, partNumber: 1 } },
                { uploadId, partNumber: "1" },
                Buffer.from("part one data")
            );

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(200);
            expect(response.headers?.["etag"]).toBeTruthy();
        });

        it("should reject a token issued for another part", async () => {
            const storage = backend.storage();
            const key = `tenants/${TENANT_ID}/files/abc/big.bin`;
            const uploadId = await storage.createMultipartUpload(key);
            const route = new UploadPartRoute(new UploadPartUseCase(backend.config(), storage));
            const request = makePartRequest(
                { key, multipart: { uploadId, partNumber: 1 } },
                { uploadId, partNumber: "2" },
                Buffer.from("x")
            );

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Token key mismatch.");
        });

        it("should reject a token issued for a single file upload", async () => {
            const route = new UploadPartRoute(
                new UploadPartUseCase(backend.config(), backend.storage())
            );
            const request = makePartRequest(
                {},
                { uploadId: "u1", partNumber: "1" },
                Buffer.from("x")
            );

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Token key mismatch.");
        });

        it("should reject a key outside the tenant's files", async () => {
            const route = new UploadPartRoute(
                new UploadPartUseCase(backend.config(), backend.storage())
            );
            const request = makePartRequest(
                {
                    key: `tenants/${TENANT_ID}/files/../../other/files/x.bin`,
                    multipart: { uploadId: "u1", partNumber: 1 }
                },
                { uploadId: "u1", partNumber: "1" },
                Buffer.from("x")
            );

            const response = await invokeHttpRoute(route, request);

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).error).toBe("Invalid path.");
        });
    });
});
