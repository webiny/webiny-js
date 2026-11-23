import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { DeleteFileFromStorageHandler } from "~/features/DeleteFileFromStorage/DeleteFileFromStorageHandler.js";
import type { ObjectStorage } from "@webiny/api-object-storage";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";
import { makeLogger } from "./utils/helpers.js";
import { makeTenantContext } from "./utils/helpers.js";

describe("tenant file keys", () => {
    it("should refuse a tenant ID that would reach into another tenant's files", () => {
        expect(() => toTenantFileKey("a/files/b", "x.txt")).toThrow("Invalid tenant ID");
        expect(() => toTenantFileKey("..", "x.txt")).toThrow("Invalid tenant ID");
    });
});

describe("delete file from storage", () => {
    it("should delete the metadata and log, not throw, when the contents can't be removed", async () => {
        const keyValueStore = { delete: vi.fn(async () => undefined) };
        const failingStorage: Partial<ObjectStorage.Interface> = {
            deletePrefix: async () => {
                throw new Error("bucket unreachable");
            }
        };
        const logger = makeLogger();
        const handler = new DeleteFileFromStorageHandler(
            makeTenantContext(),
            keyValueStore as any,
            failingStorage as ObjectStorage.Interface,
            logger
        );

        await handler.handle({ payload: { file: { id: "abc" } } } as any);

        expect(keyValueStore.delete).toHaveBeenCalledWith("FileManager/File/abc/Metadata");
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
