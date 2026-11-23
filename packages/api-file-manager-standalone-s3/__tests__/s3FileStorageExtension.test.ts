import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { ObjectStorage } from "@webiny/api-file-manager-standalone/features/ObjectStorage/abstractions.js";
import { DiskObjectStorage } from "@webiny/api-file-manager-standalone/features/ObjectStorage/DiskObjectStorage.js";
import { ObjectStorageFeature } from "@webiny/api-file-manager-standalone/features/ObjectStorage/feature.js";
import { S3FileStorageExtension } from "~/S3FileStorageExtension.js";
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

describe("S3FileStorageExtension", () => {
    it("replaces the disk storage when registered after it, as project extensions are", () => {
        Object.assign(process.env, S3_ENV);
        const container = new Container();
        ObjectStorageFeature.register(container, {
            storagePath: "/data/storage",
            uploadSecret: "secret"
        });
        const diskOnly = container.resolve(ObjectStorage);

        S3FileStorageExtension.register(container);
        const withExtension = container.resolve(ObjectStorage);

        expect(diskOnly).toBeInstanceOf(DiskObjectStorage);
        expect(withExtension).toBeInstanceOf(S3ObjectStorage);
    });
});
