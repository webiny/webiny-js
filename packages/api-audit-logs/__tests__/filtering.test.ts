import {getAuditConfig} from "~/utils/getAuditConfig.js";
import {useHandler} from "~tests/helpers/useHandler.js";
import {AUDIT} from "~/config.js";
import type {AuditLogsContext} from "~/types.js";

// FM
const createFileCreateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.CREATE);
const createFileUpdateAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.FILE.UPDATE);
// CMS Entry
const createCmsEntryCreateAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.CREATE);
const createCmsEntryUpdateAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.UPDATE);
const createCmsEntryDeleteAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.DELETE);
// Security Api Key
const createApiKeyCreateAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);


const createMockAuditLogs = async (context: AuditLogsContext): Promise<void> => {
    await createFileCreateAuditLog("File created", {fileName: "test.jpg"}, "file#0001", context);
    await createCmsEntryCreateAuditLog("Entry created", {title: "Test Entry"}, "cmsEntry#0002", context);
    await createCmsEntryUpdateAuditLog("Entry updated", {title: "Test Entry Updated"}, "cmsEntry#0002", context);
    await createApiKeyCreateAuditLog("API key created", {name: "Test API Key"}, "apiKey#0003", context);
    await createFileUpdateAuditLog("File updated", {
        before: {fileName: "test.jpg"},
        after: {fileName: "test-updated.jpg"}
    }, "file#0001", context);
    await createCmsEntryDeleteAuditLog("Entry deleted", {title: "Test Entry Updated"}, "cmsEntry#0002", context);
}

describe("audit logs filtering", () => {
    
    it("should filter by app", async () => {
        const {handler} = useHandler();
        const context = await handler();
        
        await createMockAuditLogs(context);
        
        const countResult = await context.auditLogs.listAuditLogs({});
        expect(countResult.items).toHaveLength(6)
        expect(countResult.items).toEqual([
            {
                action: "CREATE",
                app: "FILE_MANAGER",
                entityId: "file#0001",
                entity: "FILE",
            },
            {
                action: "CREATE",
                app: "HEADLESS_CMS",
                entityId: "cmsEntry#0002",
                entity: "ENTRY",
            },
            {
                action: "UPDATE",
                app: "HEADLESS_CMS",
                entityId: "cmsEntry#0002",
                entity: "ENTRY",
            },
            {
                action: "CREATE",
                app: "SECURITY",
                entityId: "apiKey#0003",
                entity: "API_KEY",
            },
            {
                action: "UPDATE",
                app: "FILE_MANAGER",
                entityId: "file#0001",
                entity: "FILE",
            },
            {
                action: "DELETE",
                app: "HEADLESS_CMS",
                entityId: "cmsEntry#0002",
                entity: "ENTRY",
            }
        ])
    })
})
