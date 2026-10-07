import { describe, expect, it } from "vitest";
import { useHandler } from "./helpers/useHandler";
import { auditAction } from "~tests/mocks/auditAction.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";
import { UpdateAuditLogUseCase } from "~/features/UpdateAuditLog/abstractions.js";

describe("update existing audit log", () => {
    it("should update existing log if still in delay period", async () => {
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

        const createdResult = await context.recordAuditLog({
            audit: {
                ...auditAction,
                action: {
                    ...auditAction.action,
                    newEntryDelay: 30
                }
            },
            message: message,
            content: data,
            entityId: entityId
        });
        if (!createdResult) {
            throw new Error("Expected the audit log to be recorded.");
        }

        expect(createdResult).toMatchObject({
            entityId,
            content: JSON.stringify(data)
        });

        const listResult = await context.listAuditLogs({});
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
        const updatedResult = await context.recordAuditLog({
            audit: {
                ...auditAction,
                action: {
                    ...auditAction.action,
                    newEntryDelay: 30
                }
            },
            message: updatedMessage,
            content: updatedData,
            entityId: entityId
        });

        expect(updatedResult).toMatchObject({
            id: createdResult.id,
            entityId,
            message: updatedMessage,
            content: JSON.stringify(updatedData)
        });
    });

    it("should keep the existing log's tags when merging into it", async () => {
        const { handler } = useHandler({});
        const context = await handler();

        const audit = {
            ...auditAction,
            action: {
                ...auditAction.action,
                newEntryDelay: 30
            }
        };
        const entityId = `${generateAlphaNumericId()}#0001`;

        const created = await context.recordAuditLog({
            audit,
            message: "Created",
            content: { before: { title: "A" }, after: { title: "B" } },
            entityId
        });
        if (!created) {
            throw new Error("Expected the audit log to be recorded.");
        }

        // Something tags the log after it was created, for example a subscriber or an admin.
        const tagResult = await context.container
            .resolve(UpdateAuditLogUseCase)
            .execute(created, { tags: ["important"] });
        expect(tagResult.isOk()).toBe(true);

        const merged = await context.recordAuditLog({
            audit,
            message: "Updated",
            content: { before: { title: "B" }, after: { title: "C" } },
            entityId
        });

        expect(merged).toMatchObject({
            id: created.id,
            message: "Updated",
            tags: ["important"],
            content: JSON.stringify({ before: { title: "A" }, after: { title: "C" } })
        });
    });
});
