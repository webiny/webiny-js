import { describe, expect, it } from "vitest";
import { AUDIT } from "~/config.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { usesDynamoDb } from "./helpers/usesDynamoDb";

describe.runIf(usesDynamoDb)("Audit Logs Tenant Index in DynamoDB", () => {
    const { handler } = useHandler();

    it("should have LastEvaluatedKey in the result and it should be the result", async () => {
        const context = await handler();

        const tenantId = context.container.resolve(TenantContext).getTenant().id;

        const auditLogs = [];

        auditLogs.push(
            await context.recordAuditLog({
                audit: AUDIT.SECURITY.API_KEY.CREATE,
                message: "API key created 1",
                content: { name: "Test API Key 1" },
                entityId: "apiKey1#0001"
            })
        );

        auditLogs.push(
            await context.recordAuditLog({
                audit: AUDIT.SECURITY.API_KEY.CREATE,
                message: "API key created 2",
                content: { name: "Test API Key 2" },
                entityId: "apiKey2#0003"
            })
        );

        auditLogs.push(
            await context.recordAuditLog({
                audit: AUDIT.SECURITY.API_KEY.CREATE,
                message: "API key created 3",
                content: { name: "Test API Key 3" },
                entityId: "apiKey3#0003"
            })
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
