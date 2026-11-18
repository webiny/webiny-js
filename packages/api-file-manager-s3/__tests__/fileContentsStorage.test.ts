import { beforeEach, describe, expect, it, vi } from "vitest";
import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { Container } from "@webiny/di";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileContentsStorage } from "@webiny/api-file-manager/features/file/FileContentsStorage/index.js";
import { FileContentsStorageFeature } from "~/features/FileContentsStorage/feature.js";
import { S3Bucket, S3Client } from "~/assetDelivery/abstractions.js";

const s3 = {
    putObject: vi.fn(),
    deleteObject: vi.fn()
};

const createStorage = () => {
    const container = new Container();
    container.registerInstance(TenantContext, {
        getTenant: () => ({ id: "t1" })
    } as unknown as TenantContext.Interface);
    container.registerInstance(S3Client, s3 as unknown as S3);
    container.registerInstance(S3Bucket, "fm-bucket");
    FileContentsStorageFeature.register(container);
    return container.resolve(FileContentsStorage);
};

const s3Error = (name: string, httpStatusCode: number) => {
    return Object.assign(new Error(name), { name, $metadata: { httpStatusCode } });
};

describe("S3 file contents storage", () => {
    beforeEach(() => {
        s3.putObject.mockReset().mockResolvedValue({});
        s3.deleteObject.mockReset().mockResolvedValue({});
    });

    it("should put the object where File Manager keeps the tenant's files, never overwriting", async () => {
        const contents = Buffer.from("generated");

        const result = await createStorage().put({
            key: "abc/report.txt",
            contents,
            contentType: "text/plain"
        });

        expect(result.isOk()).toBe(true);
        expect(s3.putObject).toHaveBeenCalledWith({
            Bucket: "fm-bucket",
            Key: "tenants/t1/files/abc/report.txt",
            Body: contents,
            ContentType: "text/plain",
            ContentLength: contents.byteLength,
            IfNoneMatch: "*"
        });
    });

    it.each([
        ["PreconditionFailed", 412],
        ["ConditionalRequestConflict", 409]
    ])("should return alreadyExists when S3 refuses the write with %s", async (name, status) => {
        s3.putObject.mockRejectedValue(s3Error(name, status));

        const result = await createStorage().put({
            key: "abc/a.txt",
            contents: Buffer.from("x"),
            contentType: "text/plain"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("FileManager/File/AlreadyExistsError");
    });

    it("should return a persistence error when the bucket write fails", async () => {
        s3.putObject.mockRejectedValue(s3Error("AccessDenied", 403));

        const result = await createStorage().put({
            key: "abc/a.txt",
            contents: Buffer.from("x"),
            contentType: "text/plain"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("FileManager/File/PersistenceError");
    });

    it("should delete the object from the tenant's files", async () => {
        const result = await createStorage().delete("abc/a.txt");

        expect(result.isOk()).toBe(true);
        expect(s3.deleteObject).toHaveBeenCalledWith({
            Bucket: "fm-bucket",
            Key: "tenants/t1/files/abc/a.txt"
        });
    });
});
