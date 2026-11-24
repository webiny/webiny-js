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

describe("assertFileStorage", () => {
    it.each(["disk", "s3"])("accepts a build with the %s storage", storage => {
        const buildParams = createBuildParams({ ObjectStorage: storage });

        expect(() => assertFileStorage(buildParams)).not.toThrow();
    });

    it("refuses a build without a storage", () => {
        const buildParams = createBuildParams({});

        expect(() => assertFileStorage(buildParams)).toThrowError(
            "No file storage is in the build. Set `path` on <Infra.FileStorage>, or add " +
                "<Infra.FileStorage.S3 />."
        );
    });
});
