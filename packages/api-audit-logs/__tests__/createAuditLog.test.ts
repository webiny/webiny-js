import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { useHandler } from "./helpers/useHandler";
import { ActionType } from "@webiny/common-audit-logs";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index";
import { auditAction } from "~tests/mocks/auditAction.js";
import type { IAuditLog } from "~/storage/types.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

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

const getIdentitySnapshot = (identity: SecurityIdentity) => {
    return {
        id: identity.id,
        type: identity.type,
        displayName: identity.displayName
    };
};

const isSql = process.env.WEBINY_STORAGE?.includes("sql");

describe.skipIf(isSql)("create audit log", () => {
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
            createdBy: getIdentitySnapshot(
                context.container.resolve(IdentityContext).getIdentity()
            ),
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
            createdBy: getIdentitySnapshot(
                context.container.resolve(IdentityContext).getIdentity()
            ),
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
});
