import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { invokeHttpRoute } from "@webiny/event-handler-core";
import { createUploadToken } from "~/utils/uploadToken.js";
import { UploadSingleFileRoute } from "~/routes/UploadSingleFileRoute/UploadSingleFileRoute.js";
import { UploadPartRoute } from "~/routes/UploadPartRoute/UploadPartRoute.js";
import { CompleteMultiPartUploadUseCase } from "~/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.js";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import {
    cleanupStorage,
    makeConfig,
    makeTenantContext,
    makeUploadRequest,
    SECRET,
    setupStorage,
    TENANT_ID
} from "./utils/helpers.js";

beforeEach(async () => {
    await setupStorage();
});

afterEach(async () => {
    await cleanupStorage();
});

describe("upload + read round trip", () => {
    it("should upload a file via route then read it back via use case", async () => {
        const config = makeConfig();
        const route = new UploadSingleFileRoute(config);
        const tenantContext = makeTenantContext();
        const fileContent = Buffer.from("round trip content");
        const fileKey = "roundtrip/test.txt";
        const storageKey = `tenants/${TENANT_ID}/files/${fileKey}`;

        const request = makeUploadRequest({
            storageKey,
            fileContent,
            filename: "test.txt"
        });

        const uploadResponse = await invokeHttpRoute(route, request);

        expect(uploadResponse.statusCode).toBe(204);

        const useCase = new GetFileContentsByKeyUseCase(tenantContext, config);
        const result = await useCase.execute(fileKey);

        expect(result.isOk()).toBe(true);
        expect(result.value.buffer.toString()).toBe("round trip content");
        expect(result.value.contentType).toBe("text/plain");
    });

    it("should upload parts, assemble, then read back", async () => {
        const config = makeConfig();
        const partRoute = new UploadPartRoute(config);
        const tenantContext = makeTenantContext();
        const uploadId = "rt-mp-001";
        const fileKey = "assembled.dat";

        const parts = [
            { num: 1, data: Buffer.from("FIRST-") },
            { num: 2, data: Buffer.from("SECOND-") },
            { num: 3, data: Buffer.from("THIRD") }
        ];

        for (const part of parts) {
            const expectedKey = `tenants/${TENANT_ID}/multipart/${uploadId}/part-${part.num}`;

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

            const response = await invokeHttpRoute(partRoute, {
                method: "PUT",
                path: "/webiny-file-upload/parts",
                headers: {},
                query: {
                    uploadId,
                    partNumber: String(part.num),
                    token
                },
                pathParameters: {},
                body: part.data
            });

            expect(response.statusCode).toBe(200);
        }

        const completeUseCase = new CompleteMultiPartUploadUseCase(tenantContext, config);
        await completeUseCase.execute({ fileKey, uploadId });

        const readUseCase = new GetFileContentsByKeyUseCase(tenantContext, config);
        const result = await readUseCase.execute(fileKey);

        expect(result.isOk()).toBe(true);
        expect(result.value.buffer.toString()).toBe("FIRST-SECOND-THIRD");
    });
});
