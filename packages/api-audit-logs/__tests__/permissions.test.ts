import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { useHandler } from "./helpers/useHandler";
import { auditAction } from "~tests/mocks/auditAction.js";

const LIST_AUDIT_LOGS = /* GraphQL */ `
    query ListAuditLogs($where: ListAuditLogsWhere) {
        auditLogs {
            listAuditLogs(where: $where) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("audit logs permissions", () => {
    it("should not list audit logs without access to audit logs", async () => {
        const { handler, invoke } = useHandler({
            permissions: [{ name: "cms.*" }]
        });
        const context = await handler();

        // Recording runs without authorization, so it works for this identity too.
        const auditLog = await context.recordAuditLog({
            audit: auditAction,
            message: "Hidden.",
            content: { some: "data" },
            entityId: "entity1"
        });
        expect(auditLog).toMatchObject({ entityId: "entity1" });

        const [response] = await invoke({
            body: { query: LIST_AUDIT_LOGS, variables: { where: { entityId: "entity1" } } }
        });

        expect(response).toEqual({
            data: {
                auditLogs: {
                    listAuditLogs: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "You cannot access audit logs."
                        }
                    }
                }
            }
        });
    });

    it("should list audit logs with access to all audit logs", async () => {
        const { handler, invoke } = useHandler({
            permissions: [{ name: "al.*" }]
        });
        const context = await handler();

        const auditLog = await context.recordAuditLog({
            audit: auditAction,
            message: "Visible.",
            content: { some: "data" },
            entityId: "entity1"
        });

        const [response] = await invoke({
            body: { query: LIST_AUDIT_LOGS, variables: { where: { entityId: "entity1" } } }
        });

        expect(response).toEqual({
            data: {
                auditLogs: {
                    listAuditLogs: {
                        data: [{ id: auditLog!.id }],
                        error: null
                    }
                }
            }
        });
    });
});
