import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditAction } from "~/types";
import { useHandler } from "./helpers/useHandler";
import { ActionType } from "~/config";
import { AUDIT_LOGS_TYPE } from "~/app/contants";
import { compressor } from "~/utils/compressor";

describe("create audit log", () => {
    const audit: AuditAction = {
        app: {
            app: "cms",
            displayName: "CMS",
            entities: []
        },
        action: {
            type: "CREATE",
            displayName: "Create"
        },
        entity: {
            type: "user",
            displayName: "Users",
            actions: [
                {
                    type: "CREATE",
                    displayName: "Create"
                },
                {
                    type: "UPDATE",
                    displayName: "Update"
                },
                {
                    type: "DELETE",
                    displayName: "Delete"
                }
            ]
        }
    };

    it("should create a new audit log", async () => {
        const createAuditLog = getAuditConfig(audit);

        const { handler } = useHandler();
        const context = await handler();

        const message = "Some Meaningful Message.";
        const entityId = "abcdefgh0001";
        const data = {
            auditLogData: {
                someData: true
            },
            moreNumberData: 1,
            evenMoreStringData: "abcdef"
        };

        const result = await createAuditLog(message, data, entityId, context);

        expect(result).toEqual({
            id: expect.any(String),
            title: message,
            content: message,
            data: {
                action: ActionType.CREATE,
                app: "cms",
                entity: "user",
                initiator: "id-12345678",
                timestamp: expect.any(Date),
                entityId,
                message,
                data: await compressor.compress(JSON.stringify(data))
            },
            location: {
                folderId: "root"
            },
            tags: [],
            type: "AuditLogs"
        });
    });

    it("should list created logs", async () => {
        const createAuditLog = getAuditConfig(audit);

        const { handler } = useHandler();
        const context = await handler();

        const message = "Some Meaningful Message.";
        const entityId = "abcdefgh0001";
        const data = {
            auditLogData: {
                someData: true
            },
            moreNumberData: 1,
            evenMoreStringData: "abcdef"
        };

        await createAuditLog(message, data, entityId, context);

        const [results] = await context.aco.getApp(AUDIT_LOGS_TYPE).search.list({});

        const [result] = results;
        expect(result).toMatchObject({
            id: expect.any(String),
            title: message,
            content: message,
            data: {
                action: ActionType.CREATE,
                app: "cms",
                entity: "user",
                initiator: "id-12345678",
                timestamp: expect.any(Date),
                entityId,
                message,
                data: JSON.stringify(data)
            },
            location: {
                folderId: "root"
            },
            tags: [],
            type: "AuditLogs"
        });
    });
});
