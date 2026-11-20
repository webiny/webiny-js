import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { invokeHttpRoute } from "@webiny/event-handler-core";
import { UploadSingleFileRoute } from "~/routes/UploadSingleFileRoute/UploadSingleFileRoute.js";
import { UploadPartRoute } from "~/routes/UploadPartRoute/UploadPartRoute.js";
import { CreateMultiPartUploadUseCase } from "~/features/CreateMultiPartUpload/CreateMultiPartUploadUseCase.js";
import { CompleteMultiPartUploadUseCase } from "~/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.js";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import type { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { makeTenantContext } from "./utils/helpers.js";
import { makeUploadRequest } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";
import { MIN_PART_SIZE } from "./utils/storageBackends.js";
import { storageBackends } from "./utils/storageBackends.js";

const API_URL = "https://api.example.com";

const publicUrls: PublicUrls.Interface = {
    getApiUrl: async () => PublicUrl.from(API_URL),
    getAdminUrl: async () => PublicUrl.from("")
};

describe.each(storageBackends)("upload + read round trip: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    it("should upload a file via route then read it back via use case", async () => {
        const storage = backend.storage();
        const route = new UploadSingleFileRoute(backend.config(), storage);
        const fileKey = "roundtrip/test.txt";
        const request = makeUploadRequest({
            storageKey: `tenants/${TENANT_ID}/files/${fileKey}`,
            fileContent: Buffer.from("round trip content"),
            filename: "test.txt"
        });

        const uploadResponse = await invokeHttpRoute(route, request);
        const useCase = new GetFileContentsByKeyUseCase(makeTenantContext(), storage);
        const result = await useCase.execute(fileKey);

        expect(uploadResponse.statusCode).toBe(204);
        expect(result.isOk()).toBe(true);
        expect(result.value.buffer.toString()).toBe("round trip content");
        expect(result.value.contentType).toBe("text/plain");
    });

    it("should create a multipart upload, upload its parts through their URLs, complete it and read it back", async () => {
        const storage = backend.storage();
        const tenantContext = makeTenantContext();
        const fileKey = "abc/assembled.dat";
        const parts = [
            Buffer.alloc(MIN_PART_SIZE, "1"),
            Buffer.alloc(MIN_PART_SIZE, "2"),
            Buffer.from("3")
        ];

        const create = new CreateMultiPartUploadUseCase(
            tenantContext,
            backend.config(),
            publicUrls,
            storage
        );
        const upload = await create.execute({
            file: {
                key: fileKey,
                name: "assembled.dat",
                size: 0,
                type: "application/octet-stream"
            },
            numberOfParts: parts.length
        } as any);

        // Each part goes to the URL the use case handed out, as the SDK sends it.
        const partRoute = new UploadPartRoute(backend.config(), storage);
        for (const part of upload.parts) {
            const url = new URL(part.url);
            const query = Object.fromEntries(url.searchParams.entries());
            const response = await invokeHttpRoute(partRoute, {
                method: "PUT",
                path: url.pathname,
                headers: {},
                query,
                pathParameters: {},
                body: parts[part.partNumber - 1]
            });
            expect(response.statusCode).toBe(200);
        }

        const complete = new CompleteMultiPartUploadUseCase(tenantContext, storage);
        await complete.execute({ fileKey, uploadId: upload.uploadId });

        const read = new GetFileContentsByKeyUseCase(tenantContext, storage);
        const result = await read.execute(fileKey);

        expect(result.isOk()).toBe(true);
        const expected = Buffer.concat(parts);
        expect(result.value.buffer.equals(expected)).toBe(true);
    });
});
