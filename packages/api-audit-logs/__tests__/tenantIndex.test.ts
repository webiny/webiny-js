import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";

const createApiKeyCreateAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

const isSql = process.env.WEBINY_STORAGE?.includes("sql");

describe.skipIf(isSql)("Audit Logs Tenant Index", () => {
    const { handler } = useHandler();

    it("should have LastEvaluatedKey in the result and it should be the result", async () => {
        const context = await handler();

        const tenantId = context.tenancy.getCurrentTenant().id;

        const auditLogs = [];

        auditLogs.push(
            await createApiKeyCreateAuditLog(
                "API key created 1",
                { name: "Test API Key 1" },
                "apiKey1#0001",
                context
            )
        );

        auditLogs.push(
            await createApiKeyCreateAuditLog(
                "API key created 2",
                { name: "Test API Key 2" },
                "apiKey2#0003",
                context
            )
        );

        auditLogs.push(
            await createApiKeyCreateAuditLog(
                "API key created 3",
                { name: "Test API Key 3" },
                "apiKey3#0003",
                context
            )
        );

        expect(auditLogs).toHaveLength(3);
        expect(auditLogs).toMatchObject([
            {
                message: "API key created 1"
            },
            {
                message: "API key created 2"
            },
            {
                message: "API key created 3"
            }
        ]);

        const documentClient = getDocumentClient();

        const scanned = await documentClient.scan({
            TableName: process.env.DB_TABLE_AUDIT_LOGS,
            IndexName: "GSI_TENANT",
            FilterExpression: "GSI_TENANT = :tenant",
            ExpressionAttributeValues: {
                ":tenant": tenantId
            }
        });

        expect(scanned.Items).toHaveLength(3);

        for (const item of scanned.Items || []) {
            expect(item).toMatchObject({
                GSI_TENANT: "root",
                PK: "T#root#AUDIT_LOG",
                SK: expect.any(String)
            });
        }
    });
});
