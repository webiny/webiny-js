import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { useHandler } from "./helpers/useHandler";
import { auditAction } from "~tests/mocks/auditAction.js";

const LIST_AUDIT_LOGS = /* GraphQL */ `
    query ListAuditLogs($where: ListAuditLogsWhere) {
        auditLogs {
            listAuditLogs(where: $where) {
                data {
                    id
                    message
                    entityId
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const GET_AUDIT_LOG = /* GraphQL */ `
    query GetAuditLog($id: ID!) {
        auditLogs {
            getAuditLog(id: $id) {
                data {
                    id
                    message
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const isSql = process.env.WEBINY_STORAGE?.includes("sql");

describe.skipIf(isSql)("audit logs graphql", () => {
    it("should list and get audit logs via graphql", async () => {
        const { handler, invoke } = useHandler();
        const context = await handler();

        const createAuditLog = getAuditConfig(auditAction);
        const created = await createAuditLog(
            "GraphQL audit log",
            { someData: true },
            "graphqlEntity0001",
            context
        );

        const [listResponse] = await invoke({
            body: { query: LIST_AUDIT_LOGS, variables: { where: {} } }
        });

        expect(listResponse.data.auditLogs.listAuditLogs.error).toBeNull();
        expect(listResponse.data.auditLogs.listAuditLogs.data).toEqual([
            {
                id: created!.id,
                message: "GraphQL audit log",
                entityId: "graphqlEntity0001"
            }
        ]);

        const [getResponse] = await invoke({
            body: { query: GET_AUDIT_LOG, variables: { id: created!.id } }
        });

        expect(getResponse.data.auditLogs.getAuditLog).toEqual({
            data: {
                id: created!.id,
                message: "GraphQL audit log"
            },
            error: null
        });
    });
});
