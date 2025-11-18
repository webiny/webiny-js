import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import { ScheduleType } from "~/scheduler/types.js";
import { PublishRecordAction } from "~/features/ProcessRecords/actions/PublishRecordAction.js";
import { RecordAction } from "~/features/ProcessRecords/index.js";

describe("PublishHandlerAction", () => {
    it("should only handle publish action", async () => {
        // @ts-expect-error No deps provided; we only test a `canHandle`.
        const action = new PublishRecordAction();

        expect(action.canHandle({ type: ScheduleType.publish })).toBe(true);
        expect(action.canHandle({ type: ScheduleType.unpublish })).toBe(false);
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
        testContainer.register(PublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];

        expect(action).toBeInstanceOf(PublishRecordAction);

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

    it("should publish an entry which is not published yet", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const testContainer = context.container.createChildContainer();
        testContainer.register(PublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];

        expect(action).toBeInstanceOf(PublishRecordAction);

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        // @ts-expect-error We only want to test the base execution.
        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry.id).toBe("target-id#0001");
    });

    it("should republish an entry which is already published", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const testContainer = context.container.createChildContainer();
        testContainer.register(PublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];

        expect(action).toBeInstanceOf(PublishRecordAction);

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        // @ts-expect-error We only want to test the base execution.
        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry.id).toBe("target-id#0001");

        // @ts-expect-error We only want to test the base execution.
        await action.handle({
            targetId: "target-id#0001",
            model
        });
        const [rePublishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(rePublishedEntry.id).toBe("target-id#0001");
        const publishedDate = new Date(publishedEntry.lastPublishedOn!);
        const rePublishedDate = new Date(rePublishedEntry.lastPublishedOn!);
        expect(rePublishedDate > publishedDate).toBeTrue();
    });

    it("should publish a new entry revision if the existing published revision is different", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const testContainer = context.container.createChildContainer();
        testContainer.register(PublishRecordAction);

        const action = testContainer.resolveAll(RecordAction)[0];

        expect(action).toBeInstanceOf(PublishRecordAction);

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        // @ts-expect-error We only want to test the base execution.
        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        await context.cms.getPublishedEntriesByIds(model, ["target-id#0001"]);

        const newEntryRevision = await context.cms.createEntryRevisionFrom(
            model,
            "target-id#0001",
            {
                title: "Test Entry - Updated"
            }
        );
        expect(newEntryRevision).toMatchObject({
            id: "target-id#0002",
            values: {
                title: "Test Entry - Updated"
            }
        });

        // @ts-expect-error We only want to test the base execution.
        await action.handle({
            targetId: "target-id#0002",
            model
        });

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, ["target-id"]);
        expect(publishedEntry.id).toBe("target-id#0002");
    });
});
