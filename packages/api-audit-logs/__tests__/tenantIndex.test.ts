import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import { AUDIT } from "~/config.js";
import { useHandler } from "~tests/helpers/useHandler.js";
import { createEntity } from "~/storage/entity.js";

const createApiKeyCreateAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

describe("Audit Logs Tenant Index", () => {
    const { handler, documentClient } = useHandler();

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

        const { entity } = createEntity({
            client: documentClient,
            tableName: process.env.DB_TABLE_AUDIT_LOGS,
            gsiAmount: 10
        });

        const results = await entity.query(tenantId, {
            index: "GSI_TENANT",
            reverse: false
        });

        expect(results).toMatchObject({
            Count: 3,
            Items: [
                {
                    GSI_TENANT: "root",
                    PK: "T#root#AUDIT_LOG",
                    SK: expect.any(String)
                },
                {
                    GSI_TENANT: "root",
                    PK: "T#root#AUDIT_LOG",
                    SK: expect.any(String)
                },
                {
                    GSI_TENANT: "root",
                    PK: "T#root#AUDIT_LOG",
                    SK: expect.any(String)
                }
            ],
            ScannedCount: 3
        });
    });
});
