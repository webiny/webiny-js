import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import { TENANT_ID } from "./utils/helpers.js";
import { storageBackends } from "./utils/storageBackends.js";

const fileWithKey = (key: string) => {
    return { key } as FileData;
};

describe.each(storageBackends)("ensure new file id: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    it("should refuse a client id whose folder already holds a file", async () => {
        const objectStorage = backend.storage();
        await objectStorage.put(`tenants/${TENANT_ID}/files/abc/a.png`, Buffer.from("a"));

        const ensure = ensureNewFileId({
            objectStorage,
            file: fileWithKey("abc/b.png"),
            tenantId: TENANT_ID,
            clientId: "abc"
        });

        await expect(ensure).rejects.toThrow('A file with id "abc" already exists.');
    });

    it("should accept a new client id, and any server generated id", async () => {
        const objectStorage = backend.storage();
        await objectStorage.put(`tenants/${TENANT_ID}/files/abc/a.png`, Buffer.from("a"));

        const newClientId = ensureNewFileId({
            objectStorage,
            file: fileWithKey("abcd/a.png"),
            tenantId: TENANT_ID,
            clientId: "abcd"
        });
        const serverId = ensureNewFileId({
            objectStorage,
            file: fileWithKey("abc/b.png"),
            tenantId: TENANT_ID,
            clientId: undefined
        });

        await expect(newClientId).resolves.toBeUndefined();
        await expect(serverId).resolves.toBeUndefined();
    });

    it("should not count another tenant's file with the same id", async () => {
        const objectStorage = backend.storage();
        await objectStorage.put("tenants/other-tenant/files/abc/a.png", Buffer.from("a"));

        const ensure = ensureNewFileId({
            objectStorage,
            file: fileWithKey("abc/a.png"),
            tenantId: TENANT_ID,
            clientId: "abc"
        });

        await expect(ensure).resolves.toBeUndefined();
    });

    it("should refuse a key outside the tenant's files", async () => {
        const ensure = ensureNewFileId({
            objectStorage: backend.storage(),
            file: fileWithKey("../../other-tenant/files/abc/a.png"),
            tenantId: TENANT_ID,
            clientId: undefined
        });

        await expect(ensure).rejects.toThrow("Invalid file key.");
    });
});
