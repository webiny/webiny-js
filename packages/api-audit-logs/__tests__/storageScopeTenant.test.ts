import { describe, it, expect } from "vitest";
import { AuditLogsStorage } from "~/abstractions.js";
import { useHandler } from "./helpers/useHandler.js";

/**
 * The audit logs storage acts on its scope's tenant (here root): it stores and lists root's logs,
 * whatever tenant a caller passes.
 */
describe("Audit logs storage: the scope's tenant", () => {
    const createAuditLog = (id: string, tenant: string) => ({
        id,
        tenant,
        createdBy: { id: "user-1", displayName: "User", type: "admin" },
        createdOn: new Date(),
        app: "scopeTest",
        action: "create",
        message: "Created.",
        entity: "thing",
        entityId: `thing#${id}`,
        tags: [],
        expiresAt: new Date(Date.now() + 60_000),
        content: "{}"
    });

    it("stores and reads the scope's tenant, whatever tenant the caller passes", async () => {
        const { handler } = useHandler();
        const { container } = await handler();
        const storage = container.resolve(AuditLogsStorage);

        // A log passed with another tenant is stored under the scope's tenant.
        const stored = await storage.store({ data: createAuditLog("log-scope-1", "other") });
        expect(stored).toMatchObject({ success: true, data: { tenant: "root" } });

        const fetched = await storage.fetch({ id: "log-scope-1", tenant: "other" });
        expect(fetched).toMatchObject({
            success: true,
            data: { id: "log-scope-1", tenant: "root" }
        });

        const listed = await storage.list({ tenant: "other", app: "scopeTest", limit: 10 });
        expect(listed.success).toBe(true);
        expect(listed.data?.map(log => [log.id, log.tenant])).toEqual([["log-scope-1", "root"]]);
    });
});
