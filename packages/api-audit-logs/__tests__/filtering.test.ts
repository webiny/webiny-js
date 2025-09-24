import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { AUDIT } from "~/config.js";
import type { AuditLogsContext } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";

// FM
const createFileCreateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);
const createFileUpdateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.UPDATE);
// CMS Entry
const createCmsEntryCreateAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.CREATE);
const createCmsEntryUpdateAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE);
const createCmsEntryDeleteAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.DELETE);
// Security Api Key
const createApiKeyCreateAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

interface ICreateMockAuditLogsParams {
    context: AuditLogsContext;
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
        await createFileCreateAuditLog(
            "File created",
            { fileName: "test.jpg" },
            "file#0001",
            context
        )
    );
    await sleep(100);
    results.push(
        await createCmsEntryCreateAuditLog(
            "Entry created",
            { title: "Test Entry" },
            "cmsEntry#0001",
            context
        )
    );
    await sleep(200);
    results.push(
        await createCmsEntryUpdateAuditLog(
            "Entry updated",
            { title: "Test Entry Updated" },
            "cmsEntry#0002",
            context
        )
    );
    await sleep(300);
    results.push(
        await createApiKeyCreateAuditLog(
            "API key created",
            { name: "Test API Key" },
            "apiKey#0003",
            context
        )
    );
    await sleep(400);
    results.push(
        await createFileUpdateAuditLog(
            "File updated",
            {
                before: { fileName: "test.jpg" },
                after: { fileName: "test-updated.jpg" }
            },
            "file#0001",
            context
        )
    );
    await sleep(500);
    results.push(
        await createCmsEntryDeleteAuditLog(
            "Entry deleted",
            { title: "Test Entry Updated" },
            "cmsEntry#0002",
            context
        )
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

        const result = await context.auditLogs.listAuditLogs({});
        expect(result.items).toHaveLength(6);
        expect(result.items).toMatchObject([...createdAuditLogs]);
    });

    it("should filter audit logs by app", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const cmsResult = await context.auditLogs.listAuditLogs({
            app: "HEADLESS_CMS"
        });
        expect(cmsResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);
        expect(cmsResult.items).toHaveLength(3);

        const fileManagerResult = await context.auditLogs.listAuditLogs({
            app: "FILE_MANAGER"
        });
        expect(fileManagerResult.items).toMatchObject([createdAuditLogs[0], createdAuditLogs[4]]);
        expect(fileManagerResult.items).toHaveLength(2);

        const securityResult = await context.auditLogs.listAuditLogs({
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

        const foundResult = await context.auditLogs.listAuditLogs({
            createdBy: context.security.getIdentity().id
        });
        expect(foundResult.items).toHaveLength(6);
        expect(foundResult.items).toMatchObject([...createdAuditLogs]);

        const notFoundResult = await context.auditLogs.listAuditLogs({
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

        const resultFrom1To4 = await context.auditLogs.listAuditLogs({
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

        const resultFrom2To3 = await context.auditLogs.listAuditLogs({
            createdOn_gte: from2,
            createdOn_lte: to3
        });

        expect(resultFrom2To3.items).toHaveLength(2);
        expect(resultFrom2To3.items).toMatchObject([createdAuditLogs[2], createdAuditLogs[3]]);
    });

    it("should filter audit logs by app and action", async () => {
        const context = await handler();
        await createMockAuditLogs({
            context
        });

        const fileManagerUpdateResult = await context.auditLogs.listAuditLogs({
            app: "FILE_MANAGER",
            action: "UPDATE"
        });
        expect(fileManagerUpdateResult.items).toHaveLength(1);
        expect(fileManagerUpdateResult.items).toMatchObject([createdAuditLogs[4]]);

        const cmsCreateResult = await context.auditLogs.listAuditLogs({
            app: "HEADLESS_CMS",
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

        const cmsEntryAllResult = await context.auditLogs.listAuditLogs({
            entityId: "cmsEntry"
        });

        expect(cmsEntryAllResult.items).toHaveLength(3);
        expect(cmsEntryAllResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);

        const cmsEntryExactResult = await context.auditLogs.listAuditLogs({
            entityId: "cmsEntry#0001"
        });

        expect(cmsEntryExactResult.items).toHaveLength(3);
        expect(cmsEntryExactResult.items).toMatchObject([
            createdAuditLogs[1],
            createdAuditLogs[2],
            createdAuditLogs[5]
        ]);

        const fileResult = await context.auditLogs.listAuditLogs({
            app: "FILE_MANAGER",
            entityId: "file#0001"
        });

        expect(fileResult.items).toHaveLength(2);
        expect(fileResult.items).toMatchObject([createdAuditLogs[0], createdAuditLogs[4]]);
    });
});
