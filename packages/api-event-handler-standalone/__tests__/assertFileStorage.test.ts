import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { assertFileStorage } from "~/config/assertFileStorage.js";

const createBuildParams = (params: Record<string, unknown>): BuildParams.Interface => {
    return {
        get: <T>(key: string): T | null => {
            const value: unknown = params[key] ?? null;
            return value as T | null;
        }
    };
};

const fileStorage = (storagePath: string | undefined) => {
    return { storagePath, uploadSecret: "upload-secret" };
};

describe("assertFileStorage", () => {
    it("accepts a folder without a storage extension", () => {
        const buildParams = createBuildParams({});

        expect(() => assertFileStorage(fileStorage("/data/storage"), buildParams)).not.toThrow();
    });

    it("accepts a storage extension without a folder", () => {
        const buildParams = createBuildParams({ ObjectStorage: "s3" });

        expect(() => assertFileStorage(fileStorage(undefined), buildParams)).not.toThrow();
    });

    it("refuses neither a folder nor a storage extension", () => {
        const buildParams = createBuildParams({});

        expect(() => assertFileStorage(fileStorage(undefined), buildParams)).toThrowError(
            "WEBINY_LOCAL_STORAGE_PATH is not set, and no file storage extension (such as " +
                "<S3Storage />) is in the build. Set one of the two."
        );
    });

    it("refuses both a folder and a storage extension", () => {
        const buildParams = createBuildParams({ ObjectStorage: "s3" });

        expect(() => assertFileStorage(fileStorage("/data/storage"), buildParams)).toThrowError(
            'WEBINY_LOCAL_STORAGE_PATH is set, but the build keeps files in "s3" storage.'
        );
    });
});
