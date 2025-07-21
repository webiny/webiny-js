import { PublishHandlerAction } from "~/handler/actions/PublishHandlerAction.js";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/mocks/scheduleClient.js";
import { MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import type { ScheduleContext } from "~/types.js";
import { ScheduleType } from "~/scheduler/types.js";

describe("PublishHandlerAction", () => {
    it("should only handle publish action", async () => {
        const action = new PublishHandlerAction({
            cms: {} as ScheduleContext["cms"]
        });

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

        const action = new PublishHandlerAction({
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

    it("should publish an entry which is not published yet", async () => {
        const handler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        const context = await handler.handler();

        const action = new PublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

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

        const action = new PublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

        const result = await action.handle({
            targetId: "target-id#0001",
            model
        });

        expect(result).toBeUndefined();

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, [
            "target-id#0001"
        ]);

        expect(publishedEntry.id).toBe("target-id#0001");

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

        const action = new PublishHandlerAction({
            cms: context.cms
        });

        const model = await context.cms.getModel(MOCK_TARGET_MODEL_ID);

        const entry = await context.cms.createEntry(model, {
            id: "target-id",
            title: "Test Entry"
        });
        expect(entry.id).toEqual("target-id#0001");

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

        await action.handle({
            targetId: "target-id#0002",
            model
        });

        const [publishedEntry] = await context.cms.getPublishedEntriesByIds(model, ["target-id"]);
        expect(publishedEntry.id).toBe("target-id#0002");
    });
});
