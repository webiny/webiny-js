import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { AUDIT } from "~/config.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";

const createFileCreateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);
const createFileUpdateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.UPDATE);

describe("audit logs list permissions", () => {
    const createLogs = async () => {
        const { handler } = useHandler();
        const context = await handler();
        await createFileCreateAuditLog("File created", { a: 1 }, "file#0001", context);
        await createFileUpdateAuditLog("File updated", { a: 2 }, "file#0001", context);
    };

    const listAs = async (permissions: { name: string }[]) => {
        const { handler } = useHandler({ permissions });
        const context = await handler();
        return context.auditLogs.listAuditLogs.bind(context.auditLogs);
    };

    it("should not list audit logs without an audit logs permission", async () => {
        await createLogs();

        const list = await listAs([{ name: "cms.settings" }]);

        await expect(list({})).rejects.toBeInstanceOf(NotAuthorizedError);
        await expect(list({ action: "CREATE" } as any)).rejects.toBeInstanceOf(NotAuthorizedError);
    });

    it("should list audit logs with full audit logs access", async () => {
        await createLogs();

        const list = await listAs([{ name: "al.*" }]);
        const result = await list({});

        expect(result.items).toHaveLength(2);
    });

    it("should list audit logs with full access", async () => {
        await createLogs();

        const list = await listAs([{ name: "*" }]);
        const result = await list({});

        expect(result.items).toHaveLength(2);
    });
});
