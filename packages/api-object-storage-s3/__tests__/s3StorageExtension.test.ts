import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { ObjectStorage } from "@webiny/api-object-storage";
import { DiskObjectStorage } from "@webiny/api-object-storage-disk";
import { DiskObjectStorageFeature } from "@webiny/api-object-storage-disk";
import { S3StorageExtension } from "~/S3StorageExtension.js";
import { S3ObjectStorage } from "~/S3ObjectStorage.js";

const S3_ENV = {
    WEBINY_S3_BUCKET: "uploads",
    WEBINY_S3_REGION: "auto",
    WEBINY_S3_ENDPOINT: "https://account.r2.cloudflarestorage.com"
};

afterEach(() => {
    for (const name of Object.keys(S3_ENV)) {
        delete process.env[name];
    }
});

describe("S3StorageExtension", () => {
    it("replaces the disk storage when registered after it, as project extensions are", () => {
        Object.assign(process.env, S3_ENV);
        const container = new Container();
        DiskObjectStorageFeature.register(container, { path: "/data/storage" });
        const diskOnly = container.resolve(ObjectStorage);

        S3StorageExtension.register(container);
        const withExtension = container.resolve(ObjectStorage);

        expect(diskOnly).toBeInstanceOf(DiskObjectStorage);
        expect(withExtension).toBeInstanceOf(S3ObjectStorage);
    });
});
