import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
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

describe("audit logs GraphQL API", () => {
    it("should list and get audit logs", async () => {
        const { handler, invoke } = useHandler();
        const context = await handler();

        const createAuditLog = getAuditConfig(auditAction);
        const auditLog = await createAuditLog(
            "Read me back.",
            { some: "data" },
            "entity1",
            context.recorder
        );

        const [listResponse] = await invoke({
            body: { query: LIST_AUDIT_LOGS, variables: { where: { entityId: "entity1" } } }
        });

        expect(listResponse).toEqual({
            data: {
                auditLogs: {
                    listAuditLogs: {
                        data: [
                            {
                                id: auditLog!.id,
                                message: "Read me back.",
                                entityId: "entity1"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        const [getResponse] = await invoke({
            body: { query: GET_AUDIT_LOG, variables: { id: auditLog!.id } }
        });

        expect(getResponse).toEqual({
            data: {
                auditLogs: {
                    getAuditLog: {
                        data: {
                            id: auditLog!.id,
                            message: "Read me back."
                        },
                        error: null
                    }
                }
            }
        });
    });
});
