import { describe, it, expect } from "vitest";
import { TenantScopeMismatchError } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { FlpStorageOperations } from "~/features/folder/shared/abstractions.js";
import { useHandler } from "./utils/useHandler";

/**
 * The folder-level permissions storage acts on its scope's tenant (here root): it stores and reads
 * root's permissions, and throws when it's given another tenant.
 */
describe("Folder-level permissions storage: the scope's tenant", () => {
    const flp = {
        id: "flp-scope-1",
        tenant: "root",
        type: "scopeTest",
        slug: "a",
        path: "root/a",
        parentId: "root",
        permissions: []
    };

    it("stores and reads the scope's tenant, and throws for another tenant", async ({ skip }) => {
        const { handler } = useHandler();
        const { container } = await handler();

        let storage: FlpStorageOperations.Interface;
        try {
            storage = container.resolve(FlpStorageOperations);
        } catch {
            // Postgres keeps folder-level permissions in its folder catalog instead.
            return skip();
        }

        await storage.create({ data: flp });
        expect(await storage.get({ tenant: "root", id: flp.id })).toMatchObject({ id: flp.id });

        await expect(storage.get({ tenant: "other", id: flp.id })).rejects.toThrow(
            TenantScopeMismatchError
        );
        await expect(storage.list({ where: { tenant: "other", type: flp.type } })).rejects.toThrow(
            TenantScopeMismatchError
        );
        await expect(
            storage.create({ data: { ...flp, id: "flp-scope-2", tenant: "other" } })
        ).rejects.toThrow(TenantScopeMismatchError);

        // Nothing was written for the other tenant's record.
        expect(await storage.get({ tenant: "root", id: "flp-scope-2" })).toBeNull();
    });
});
