import { describe, expect, it } from "vitest";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { useHandler } from "./helpers/useHandler";
import { auditAction } from "~tests/mocks/auditAction.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import type { IAuditLog } from "~/storage/types.js";

describe("update existing audit log", () => {
    it("should update existing log if still in delay period", async () => {
        const createAuditLog = getAuditConfig({
            ...auditAction,
            action: {
                ...auditAction.action,
                newEntryDelay: 30
            }
        });

        const { handler } = useHandler({});

        const context = await handler();

        const message = "Some Meaningful Message.";
        const entityId = `${generateAlphaNumericId()}#0001`;
        const data = {
            auditLogData: {
                someData: true
            },
            moreNumberData: 1,
            evenMoreStringData: "abcdef"
        };

        const createdResult = (await createAuditLog(message, data, entityId, context)) as IAuditLog;

        expect(createdResult).toMatchObject({
            entityId,
            content: JSON.stringify(data)
        });

        const listResult = await context.auditLogs.listAuditLogs({});
        expect(listResult.items).toHaveLength(1);
        expect(listResult.items?.[0]).toMatchObject({
            entityId,
            id: createdResult.id,
            content: JSON.stringify(data)
        });

        const updatedData = {
            ...data,
            someMoreData: true
        };
        const updatedMessage = "Updated audit log";
        const updatedResult = (await createAuditLog(
            updatedMessage,
            updatedData,
            entityId,
            context
        )) as IAuditLog;

        expect(updatedResult).toMatchObject({
            id: createdResult.id,
            entityId,
            message: updatedMessage,
            content: JSON.stringify(updatedData)
        });
    });
});
