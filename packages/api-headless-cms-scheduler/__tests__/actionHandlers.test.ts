import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./mocks/scheduleClient.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { ScheduleEntryActionUseCase } from "~/features/ScheduleEntryAction/index.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "~tests/mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { ListScheduledActionsUseCase, ExecuteScheduledActionUseCase } from "@webiny/api-scheduler";

describe("Action Handlers", () => {
    let context: CmsContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            plugins: [createHeadlessCmsScheduler(), createMockTargetModelPlugins()],
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
    });

    it("should publish and unpublish an entry", async () => {
        const container = context.container;

        const getModel = container.resolve(GetModelUseCase);
        const createEntry = container.resolve(CreateEntryUseCase);
        const getEntryById = container.resolve(GetEntryByIdUseCase);
        const scheduleEntryAction = container.resolve(ScheduleEntryActionUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);

        const modelResult = await getModel.execute(MOCK_TARGET_MODEL_ID);
        const entryResult = await createEntry.execute(modelResult.value, {
            title: "First entry"
        });

        expect(entryResult.value.status).toBe("draft");

        // Schedule entry for publishing
        const publishActionResult = await scheduleEntryAction.execute({
            modelId: MOCK_TARGET_MODEL_ID,
            targetId: entryResult.value.id,
            actionType: "Publish",
            scheduleOn: new Date(Date.now() + 100000).toISOString()
        });

        // Assert scheduled actions
        const actionsResponse = await listScheduledActions.execute({
            where: { namespace_startsWith: "Cms/Entry" }
        });

        expect(actionsResponse.value.items).toHaveLength(1);
        expect(actionsResponse.value.items[0].title).toBe("First entry");

        // Execute actions
        const scheduledAction = publishActionResult.value;
        await executeScheduledAction.execute(scheduledAction.id);

        // Assert entry published
        const publishedEntryResult = await getEntryById.execute(
            modelResult.value,
            entryResult.value.id
        );

        expect(publishedEntryResult.value.status).toBe("published");

        // Schedule entry for unpublishing
        const unpublishActionResult = await scheduleEntryAction.execute({
            modelId: MOCK_TARGET_MODEL_ID,
            targetId: entryResult.value.id,
            actionType: "Unpublish",
            scheduleOn: new Date(Date.now() + 1000000).toISOString()
        });

        // Execute action handler
        await executeScheduledAction.execute(unpublishActionResult.value.id);

        const unpublishedEntryResult = await getEntryById.execute(
            modelResult.value,
            entryResult.value.id
        );

        expect(unpublishedEntryResult.value.status).toBe("unpublished");
    });
});
