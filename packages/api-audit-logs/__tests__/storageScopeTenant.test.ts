import { describe, it, expect } from "vitest";
import { TenantScopeMismatchError } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { AuditLogsStorage } from "~/abstractions.js";
import { useHandler } from "./helpers/useHandler.js";

/**
 * The audit logs storage acts on its scope's tenant (here root): it stores and lists root's logs,
 * and refuses another tenant.
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

    it("stores and reads the scope's tenant, and refuses another tenant", async () => {
        const { handler } = useHandler();
        const { container } = await handler();
        const storage = container.resolve(AuditLogsStorage);

        const stored = await storage.store({ data: createAuditLog("log-scope-1", "root") });
        expect(stored.success).toBe(true);
        const fetched = await storage.fetch({ id: "log-scope-1", tenant: "root" });
        expect(fetched.success).toBe(true);

        const fetchedOther = await storage.fetch({ id: "log-scope-1", tenant: "other" });
        expect(fetchedOther.success).toBe(false);
        expect(fetchedOther.error).toBeInstanceOf(TenantScopeMismatchError);

        const listedOther = await storage.list({ tenant: "other", limit: 10 });
        expect(listedOther.success).toBe(false);
        expect(listedOther.error).toBeInstanceOf(TenantScopeMismatchError);

        const storedOther = await storage.store({ data: createAuditLog("log-scope-2", "other") });
        expect(storedOther.success).toBe(false);
        expect(storedOther.error).toBeInstanceOf(TenantScopeMismatchError);
        expect((await storage.fetch({ id: "log-scope-2", tenant: "root" })).success).toBe(false);
    });
});
