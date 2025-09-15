import { UnpublishHandlerAction } from "~/handler/actions/UnpublishHandlerAction.js";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import type { ScheduleContext } from "~/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import { describe, expect, it, vi } from "vitest";

describe("UnpublishHandlerAction", () => {
    it("should only handle unpublish action", async () => {
        const action = new UnpublishHandlerAction({
            cms: {} as ScheduleContext["cms"]
        });

        expect(action.canHandle({ type: ScheduleType.publish })).toBe(false);
        expect(action.canHandle({ type: ScheduleType.unpublish })).toBe(true);
    });

    it("should throw an error if target entry does not exist", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const action = new UnpublishHandlerAction({
            cms: context.cms
        });

        try {
            const result = await action.handle({
                targetId: "target-id#0001",
                model
            });
            expect(result).toEqual("Should not reach here.");
        } catch (ex) {
            expect(ex.message).toBe(`Entry by ID "target-id#0001" not found.`);
        }
    });

    it("should do nothing if entry is not published", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const action = new UnpublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        console.warn = vi.fn();

        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        expect(console.warn).toHaveBeenCalledWith(
            `Entry "target-id#0001" is not published, nothing to unpublish.`
        );

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry).toBeUndefined();
    });

    it("should unpublish an entry if it matches", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const action = new UnpublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        await context.cms.publishEntry(model, "target-id#0001");

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry.id).toBe("target-id#0001");

        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        await action.handle({
            targetId: "target-id#0001",
            model
        });
        const [unpublishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(unpublishedEntry).toBeUndefined();
    });

    it("should unpublish entry even if it does not match the target ID (revision).", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const action = new UnpublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        await context.cms.publishEntry(model, "target-id#0001");

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry.id).toBe("target-id#0001");

        const newEntryRevision = await context.cms.createEntryRevisionFrom(
            model,
            publishedEntry.id,
            {
                title: "Test Entry - Updated"
            }
        );

        expect(newEntryRevision.id).toEqual("target-id#0002");

        await context.cms.publishEntry(model, "target-id#0002");

        const [publishedOverwriteEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0002"
        ]);

        expect(publishedOverwriteEntry.id).toBe("target-id#0002");

        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        await action.handle({
            targetId: "target-id#0001",
            model
        });
        const [unpublishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(unpublishedEntry).toBeUndefined();
    });
});
