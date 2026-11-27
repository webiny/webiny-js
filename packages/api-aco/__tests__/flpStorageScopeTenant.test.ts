import { describe, it, expect } from "vitest";
import { FlpStorageOperations } from "~/features/folder/shared/abstractions.js";
import { useHandler } from "./utils/useHandler";

/**
 * The folder-level permissions storage acts on its scope's tenant (here root): it stores and reads
 * root's permissions, whatever tenant a caller passes.
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

    it("stores and reads the scope's tenant, whatever tenant the caller passes", async ({
        skip
    }) => {
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
        // Read from the scope's tenant: the passed tenant is ignored.
        expect(await storage.get({ tenant: "other", id: flp.id })).toMatchObject({ id: flp.id });

        // A record passed with another tenant is stored under the scope's tenant.
        await storage.create({ data: { ...flp, id: "flp-scope-2", tenant: "other" } });
        expect(await storage.get({ tenant: "root", id: "flp-scope-2" })).toMatchObject({
            id: "flp-scope-2"
        });

        await storage.update({ original: flp, data: { tenant: "other", slug: "b" } });
        expect(await storage.get({ tenant: "root", id: flp.id })).toMatchObject({ slug: "b" });

        const listed = await storage.list({ where: { tenant: "other", type: flp.type } });
        expect(listed.map(item => item.id).sort()).toEqual([flp.id, "flp-scope-2"]);
    });
});
