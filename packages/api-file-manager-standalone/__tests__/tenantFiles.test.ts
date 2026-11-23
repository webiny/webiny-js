import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { DeleteFileFromStorageHandler } from "~/features/DeleteFileFromStorage/DeleteFileFromStorageHandler.js";
import type { ObjectStorage } from "@webiny/api-object-storage";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";
import { makeLogger } from "./utils/helpers.js";
import { makeTenantContext } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";

describe("tenant file keys", () => {
    it("should refuse a tenant ID that would reach into another tenant's files", () => {
        expect(() => toTenantFileKey("a/files/b", "x.txt")).toThrow("Invalid tenant ID");
        expect(() => toTenantFileKey("..", "x.txt")).toThrow("Invalid tenant ID");
    });
});

interface DeleteSetup {
    storage?: Partial<ObjectStorage.Interface>;
    metadataDeleteFails?: boolean;
}

const createDeleteHandler = (setup: DeleteSetup = {}) => {
    const keyValueStore = {
        delete: vi.fn(async () => {
            if (setup.metadataDeleteFails) {
                return Result.fail(new Error("table unreachable"));
            }
            return Result.ok();
        })
    };
    const storage = {
        delete: vi.fn(async () => undefined),
        deletePrefix: vi.fn(async () => undefined),
        ...setup.storage
    };
    const logger = makeLogger();
    const handler = new DeleteFileFromStorageHandler(
        makeTenantContext(),
        keyValueStore as any,
        storage as unknown as ObjectStorage.Interface,
        logger
    );
    return { handler, keyValueStore, storage, logger };
};

const deleteEvent = (file: { id: string; key: string }) => {
    return { payload: { file } } as any;
};

describe("delete file from storage", () => {
    it("should delete the file's folder when it is named after the file", async () => {
        const { handler, keyValueStore, storage } = createDeleteHandler();

        await handler.handle(deleteEvent({ id: "abc", key: "abc/photo.png" }));

        expect(keyValueStore.delete).toHaveBeenCalledWith("FileManager/File/abc/Metadata");
        expect(storage.deletePrefix).toHaveBeenCalledWith(`tenants/${TENANT_ID}/files/abc/`);
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it("should delete the folder under a key prefix", async () => {
        const { handler, storage } = createDeleteHandler();

        await handler.handle(deleteEvent({ id: "abc", key: "uploads/abc/photo.png" }));

        expect(storage.deletePrefix).toHaveBeenCalledWith(
            `tenants/${TENANT_ID}/files/uploads/abc/`
        );
    });

    it("should delete only the file's own object when its folder belongs to another file", async () => {
        const { handler, storage } = createDeleteHandler();

        await handler.handle(deleteEvent({ id: "mine", key: "theirs/photo.png" }));

        expect(storage.deletePrefix).not.toHaveBeenCalled();
        expect(storage.delete).toHaveBeenCalledWith(`tenants/${TENANT_ID}/files/theirs/photo.png`);
    });

    it("should log, not throw, when the contents can't be removed", async () => {
        const { handler, logger } = createDeleteHandler({
            storage: {
                deletePrefix: async () => {
                    throw new Error("bucket unreachable");
                }
            }
        });

        await handler.handle(deleteEvent({ id: "abc", key: "abc/photo.png" }));

        expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it("should log a failed metadata delete and still delete the contents", async () => {
        const { handler, storage, logger } = createDeleteHandler({ metadataDeleteFails: true });

        await handler.handle(deleteEvent({ id: "abc", key: "abc/photo.png" }));

        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(storage.deletePrefix).toHaveBeenCalledTimes(1);
    });
});
