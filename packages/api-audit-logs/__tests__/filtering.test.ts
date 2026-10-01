import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import type { AuditLogsTestContext } from "~tests/helpers/useHandler.js";
import { AUDIT } from "~/config.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { IAuditLog } from "~/storage/types.js";

// FM
// CMS Entry
// Security Api Key

interface ICreateMockAuditLogsParams {
    context: AuditLogsTestContext;
    activateSleep?: boolean;
}

const createSleep = (active: boolean) => {
    if (!active) {
        return async (): Promise<void> => {
            return new Promise(resolve => setTimeout(resolve, 2));
        };
    }
    return async (ms: number): Promise<void> => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
};

const createMockAuditLogs = async (params: ICreateMockAuditLogsParams): Promise<IAuditLog[]> => {
    const { context, activateSleep = false } = params;

    const results: (IAuditLog | null)[] = [];

    const sleep = createSleep(activateSleep);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.FILE_MANAGER.FILE.CREATE,
            message: "File created",
            content: { fileName: "test.jpg" },
            entityId: "file#0001"
        })
    );
    await sleep(100);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.HEADLESS_CMS.ENTRY.CREATE,
            message: "Entry created",
            content: { title: "Test Entry" },
            entityId: "cmsEntry#0001"
        })
    );
    await sleep(200);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE,
            message: "Entry updated",
            content: { title: "Test Entry Updated" },
            entityId: "cmsEntry#0002"
        })
    );
    await sleep(300);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.SECURITY.API_KEY.CREATE,
            message: "API key created",
            content: { name: "Test API Key" },
            entityId: "apiKey#0003"
        })
    );
    await sleep(400);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.FILE_MANAGER.FILE.UPDATE,
            message: "File updated",
            content: {
                before: { fileName: "test.jpg" },
                after: { fileName: "test-updated.jpg" }
            },
            entityId: "file#0001"
        })
    );
    await sleep(500);
    results.push(
        await context.recordAuditLog({
            audit: AUDIT.HEADLESS_CMS.ENTRY.DELETE,
            message: "Entry deleted",
            content: { title: "Test Entry Updated" },
            entityId: "cmsEntry#0002"
        })
    );
    return results as IAuditLog[];
};

describe("audit logs filtering", () => {
    const { handler } = useHandler();

    const createdAuditLogs = [
        {
            action: "CREATE",
            app: "FILE_MANAGER",
            entityId: "file#0001",
            entity: "FILE"
        },
        {
            action: "CREATE",
            app: "HEADLESS_CMS",
            entityId: "cmsEntry#0001",
            entity: "ENTRY"
        },
        {
            action: "UPDATE",
            app: "HEADLESS_CMS",
            entityId: "cmsEntry#0002",
            entity: "ENTRY_REVISION"
        },
        {
            action: "CREATE",
            app: "SECURITY",
            entityId: "apiKey#0003",
            entity: "API_KEY"
        },
        {
            action: "UPDATE",
            app: "FILE_MANAGER",
            entityId: "file#0001",
            entity: "FILE"
        },
        {
            action: "DELETE",
            app: "HEADLESS_CMS",
            entityId: "cmsEntry#0002",
            entity: "ENTRY"
        }
    ];

    it("should verify that all mock audit logs exist", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const result = await context.listAuditLogs({});
        expect(result.items).toHaveLength(6);
        expect(result.items).toMatchObject([...createdAuditLogs]);
    });

    it("should filter audit logs by app", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const cmsResult = await context.listAuditLogs({
            app: "HEADLESS_CMS"
        });
        expect(cmsResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);
        expect(cmsResult.items).toHaveLength(3);

        const fileManagerResult = await context.listAuditLogs({
            app: "FILE_MANAGER"
        });
        expect(fileManagerResult.items).toMatchObject([createdAuditLogs[0], createdAuditLogs[4]]);
        expect(fileManagerResult.items).toHaveLength(2);

        const securityResult = await context.listAuditLogs({
            app: "SECURITY"
        });
        expect(securityResult.items).toMatchObject([createdAuditLogs[3]]);
        expect(securityResult.items).toHaveLength(1);
    });

    it("should filter audit logs by user", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const foundResult = await context.listAuditLogs({
            createdBy: context.container.resolve(IdentityContext).getIdentity().id
        });
        expect(foundResult.items).toHaveLength(6);
        expect(foundResult.items).toMatchObject([...createdAuditLogs]);

        const notFoundResult = await context.listAuditLogs({
            createdBy: "unknown"
        });
        expect(notFoundResult.items).toHaveLength(0);
    });

    it("should filter audit logs by createdOn", async () => {
        const context = await handler();
        const logs = await createMockAuditLogs({
            context,
            activateSleep: true
        });

        const from1 = logs[1].createdOn;
        const to4 = logs[4].createdOn;

        const resultFrom1To4 = await context.listAuditLogs({
            createdOn_gte: from1,
            createdOn_lte: to4
        });

        expect(resultFrom1To4.items).toHaveLength(4);
        expect(resultFrom1To4.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[3],
            createdAuditLogs[4]
        ]);

        const from2 = logs[2].createdOn;
        const to3 = logs[3].createdOn;

        const resultFrom2To3 = await context.listAuditLogs({
            createdOn_gte: from2,
            createdOn_lte: to3
        });

        expect(resultFrom2To3.items).toHaveLength(2);
        expect(resultFrom2To3.items).toMatchObject([createdAuditLogs[2], createdAuditLogs[3]]);
    });

    it("should filter audit logs by app, entity and action", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const fileManagerUpdateResult = await context.listAuditLogs({
            app: "FILE_MANAGER",
            entity: "FILE",
            action: "UPDATE"
        });
        expect(fileManagerUpdateResult.items).toMatchObject([createdAuditLogs[4]]);
        expect(fileManagerUpdateResult.items).toHaveLength(1);

        const cmsCreateResult = await context.listAuditLogs({
            app: "HEADLESS_CMS",
            entity: "ENTRY",
            action: "CREATE"
        });
        expect(cmsCreateResult.items).toHaveLength(1);
        expect(cmsCreateResult.items).toMatchObject([createdAuditLogs[1]]);
    });

    it("should filter audit logs by entityId", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const cmsEntryAllResult = await context.listAuditLogs({
            entityId: "cmsEntry"
        });

        expect(cmsEntryAllResult.items).toHaveLength(3);
        expect(cmsEntryAllResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);

        const cmsEntryExactResult = await context.listAuditLogs({
            entityId: "cmsEntry#0001"
        });

        expect(cmsEntryExactResult.items).toHaveLength(3);
        expect(cmsEntryExactResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);

        const fileResult = await context.listAuditLogs({
            app: "FILE_MANAGER",
            entityId: "file#0001"
        });

        expect(fileResult.items).toHaveLength(2);
        expect(fileResult.items).toMatchObject([createdAuditLogs[0], createdAuditLogs[4]]);
    });
});
