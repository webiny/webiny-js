import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import { ScheduleType } from "~/scheduler/types.js";
import { describe, expect, it, vi } from "vitest";
import { UnpublishRecordAction } from "~/features/ProcessRecords/actions/UnpublishRecordAction.js";
import { RecordAction } from "~/features/ProcessRecords/index.js";

describe("UnpublishHandlerAction", () => {
    it("should only handle unpublish action", async () => {
        // @ts-expect-error No deps provided; we only test a `canHandle`.
        const action = new UnpublishRecordAction();

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

        const testContainer = context.container.createChildContainer();
        testContainer.register(UnpublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];
        expect(action).toBeInstanceOf(UnpublishRecordAction);

        try {
            // @ts-expect-error We only want to test the base execution.
            const result = await action.handle({
                targetId: "target-id#0001",
                model
            });
            expect(result).toEqual("Should not reach here.");
        } catch (ex) {
            expect(ex.message).toBe(`Entry "target-id#0001" was not found!`);
        }
    });

    it("should do nothing if entry is not published", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const testContainer = context.container.createChildContainer();
        testContainer.register(UnpublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];
        expect(action).toBeInstanceOf(UnpublishRecordAction);

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        console.warn = vi.fn();

        // @ts-expect-error We only want to test the base execution.
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

        const testContainer = context.container.createChildContainer();
        testContainer.register(UnpublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];
        expect(action).toBeInstanceOf(UnpublishRecordAction);

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

        // @ts-expect-error We only want to test the base execution.
        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        // @ts-expect-error We only want to test the base execution.
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

        const testContainer = context.container.createChildContainer();
        testContainer.register(UnpublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];
        expect(action).toBeInstanceOf(UnpublishRecordAction);

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

        // @ts-expect-error We only want to test the base execution.
        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        // @ts-expect-error We only want to test the base execution.
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
