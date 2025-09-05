import { getAuditConfig } from "~/utils/getAuditConfig";
import { useHandler } from "./helpers/useHandler";
import { ActionType } from "@webiny/common-audit-logs/index.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index";
import { attachAuditLogOnCreateEvent } from "~/context/lifecycle.js";
import { auditAction } from "~tests/mocks/auditAction.js";
import type { IAuditLog } from "~/storage/types.js";

const convertDates = (item: IAuditLog | null) => {
    return {
        ...item,
        expiresAt: new Date(item!.expiresAt.getTime()),
        createdOn: new Date(item!.createdOn.getTime())
    } as IAuditLog;
};

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

    it("should create a new audit log", async () => {
        const createAuditLog = getAuditConfig(auditAction);

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

        expect(convertDates(result)).toMatchObject({
            id: expect.any(String),
            message,
            tenant: "root",
            expiresAt: expect.any(Date),
            entityId,
            action: ActionType.CREATE,
            app: "cms",
            entity: "user",
            createdBy: context.security.getIdentity(),
            createdOn: expect.any(Date),
            content: JSON.stringify(data),
            tags: []
        });

        const partitionKey = `T#root#AUDIT_LOG`;
        const sortKey = `${result!.id}`;

        const scanned = await client.scan({
            TableName: process.env.DB_TABLE_AUDIT_LOGS
        });

        expect(scanned.Count).toBe(1);

        for (const item of scanned.Items || []) {
            expect(item).toMatchObject({
                PK: partitionKey,
                SK: sortKey,
                data: {
                    content: expect.stringMatching(`{"compression":"gzip","value":`)
                }
            });
        }
    });

    it("should list created logs", async () => {
        const createAuditLog = getAuditConfig(auditAction);

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

        const { items } = await context.auditLogs.listAuditLogs({});
        expect(items).toHaveLength(1);

        const result = items![0];
        expect(convertDates(result)).toMatchObject({
            id: expect.any(String),
            message,
            tenant: "root",
            expiresAt: expect.any(Date),
            entityId,
            action: ActionType.CREATE,
            app: "cms",
            entity: "user",
            createdBy: context.security.getIdentity(),
            createdOn: expect.any(Date),
            content: JSON.stringify(data),
            tags: []
        });

        const partitionKey = `T#root#AUDIT_LOG`;
        const sortKey = `${result!.id}`;

        const scanned = await client.scan({
            TableName: process.env.DB_TABLE_AUDIT_LOGS
        });

        expect(scanned.Count).toBe(1);

        for (const item of scanned.Items || []) {
            expect(item).toMatchObject({
                PK: partitionKey,
                SK: sortKey,
                data: {
                    content: expect.stringMatching(`{"compression":"gzip","value":`)
                }
            });
        }
    });

    it("should trigger onBeforeCreate", async () => {
        const createAuditLog = getAuditConfig(auditAction);

        const { handler } = useHandler({
            plugins: [
                attachAuditLogOnCreateEvent(async ({ auditLog, setAuditLog }) => {
                    const content = JSON.parse(auditLog.content);
                    setAuditLog({
                        content: JSON.stringify({
                            ...content,
                            moreNumberData: 2,
                            additionalData: "something else"
                        })
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

        expect(convertDates(result)).toMatchObject({
            id: expect.any(String),
            message,
            tenant: "root",
            expiresAt: expect.any(Date),
            entityId,
            action: ActionType.CREATE,
            app: "cms",
            entity: "user",
            createdBy: context.security.getIdentity(),
            createdOn: expect.any(Date),
            content: JSON.stringify({
                ...data,
                moreNumberData: 2,
                additionalData: "something else"
            }),
            tags: []
        });

        const item = await context.auditLogs.getAuditLog(result!.id);

        const content =
            // @ts-expect-error
            JSON.parse(item?.content);

        expect(content).toEqual({
            auditLogData: {
                someData: true
            },
            moreNumberData: 2,
            evenMoreStringData: "abcdef",
            additionalData: "something else"
        });
    });
});
