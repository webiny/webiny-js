import { getAuditConfig } from "~/utils/getAuditConfig";
import type { AuditAction } from "~/types";
import { useHandler } from "./helpers/useHandler";
import { ActionType } from "~/config";
import { AUDIT_LOGS_TYPE } from "~/app/contants";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index";
import { parseIdentifier } from "@webiny/utils/parseIdentifier";
import { attachAuditLogOnCreateEvent } from "~/app/lifecycle.js";

interface ITestPayloadData {
    auditLogData: {
        someData: boolean;
    };
    moreNumberData: number;
    evenMoreStringData: string;
    additionalData?: string;
}

describe("create audit log", () => {
    const client = getDocumentClient();

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
        expect.assertions(3);

        const createAuditLog = getAuditConfig(audit);

        const { handler } = useHandler();
        const context = await handler();

        const message = "Some Meaningful Message.";
        const entityId = "abcdefgh0001";
        const data: ITestPayloadData = {
            auditLogData: {
                someData: true
            },
            moreNumberData: 1,
            evenMoreStringData: "abcdef"
        };

        const result = await createAuditLog(message, data, entityId, context);

        expect(result).toMatchObject({
            id: expect.any(String),
            title: message,
            content: message,
            data: {
                action: ActionType.CREATE,
                app: "cms",
                entity: "user",
                initiator: "id-12345678",
                timestamp: expect.toBeDateString(),
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

        // @ts-expect-error
        const partitionKey = `#CME#wby-aco-${result!.id}`;

        const scanned = await client.scan({
            TableName: process.env.DB_TABLE
        });

        for (const item of scanned.Items || []) {
            if (item.PK.includes(partitionKey) === false) {
                continue;
            }
            expect(item).toMatchObject({
                PK: expect.stringContaining(partitionKey),
                values: {
                    "object@data": {
                        "text@data": expect.stringMatching(`{"compression":"gzip","value":`)
                    }
                }
            });
        }
    });

    it("should list created logs", async () => {
        expect.assertions(3);

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

        const { id: partitionKey } = parseIdentifier(`${result!.id}`);

        const scanned = await client.scan({
            TableName: process.env.DB_TABLE
        });

        for (const item of scanned.Items || []) {
            if (item.PK.includes(partitionKey) === false) {
                continue;
            }
            expect(item).toMatchObject({
                PK: expect.stringContaining(partitionKey),
                values: {
                    "object@data": {
                        "text@data": expect.stringMatching(`{"compression":"gzip","value":`)
                    }
                }
            });
        }
    });

    it("should trigger onBeforeCreate", async () => {
        const createAuditLog = getAuditConfig(audit);

        const { handler } = useHandler({
            plugins: [
                attachAuditLogOnCreateEvent<ITestPayloadData>(async ({ payload, setPayload }) => {
                    setPayload({
                        data: {
                            ...payload.data,
                            moreNumberData: 2,
                            additionalData: "something else"
                        }
                    });
                })
            ]
        });
        const context = await handler();

        const message = "Some Meaningful Message.";
        const entityId = "abcdefgh0001";
        const data: ITestPayloadData = {
            auditLogData: {
                someData: true
            },
            moreNumberData: 1,
            evenMoreStringData: "abcdef"
        };

        const result = await createAuditLog(message, data, entityId, context);

        expect(result).toMatchObject({
            id: expect.any(String),
            title: message,
            content: message,
            data: {
                action: ActionType.CREATE,
                app: "cms",
                entity: "user",
                initiator: "id-12345678",
                timestamp: expect.toBeDateString(),
                entityId,
                message,
                data: JSON.stringify({
                    auditLogData: {
                        someData: true
                    },
                    moreNumberData: 2,
                    evenMoreStringData: "abcdef",
                    additionalData: "something else"
                })
            },
            location: {
                folderId: "root"
            },
            tags: [],
            type: "AuditLogs"
        });

        const decompressedData =
            // @ts-expect-error
            JSON.parse(result.data.data);

        expect(decompressedData).toEqual({
            auditLogData: {
                someData: true
            },
            moreNumberData: 2,
            evenMoreStringData: "abcdef",
            additionalData: "something else"
        });
    });
});
