import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "./__mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import {
    ExecuteScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { WEBSITE_BUILDER_NAMESPACE } from "~/utils/namespace.js";
import {
    SchedulePublishEntryUseCase,
    ScheduleUnpublishEntryUseCase
} from "~/exports/api/cms/scheduler.js";

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
        const schedulePublish = container.resolve(SchedulePublishEntryUseCase);
        const scheduleUnpublish = container.resolve(ScheduleUnpublishEntryUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);

        const modelResult = await getModel.execute(MOCK_TARGET_MODEL_ID);
        const entryResult = await createEntry.execute(modelResult.value, {
            values: {
                title: "First entry"
            }
        });

        expect(entryResult.value.status).toBe("draft");

        // Schedule entry for publishing
        const publishActionResult = await schedulePublish.execute({
            id: entryResult.value.id,
            model: modelResult.value,
            scheduleFor: new Date(Date.now() + 100000)
        });

        // Assert scheduled actions
        const actionsResponse = await listScheduledActions.execute({
            where: {
                namespace_startsWith: WEBSITE_BUILDER_NAMESPACE
            }
        });

        expect(actionsResponse.value.items).toHaveLength(1);
        expect(actionsResponse.value.items[0].title).toBe("First entry");

        // Execute actions
        const scheduledAction = publishActionResult.value;
        await executeScheduledAction.execute({
            id: scheduledAction.scheduledAction.id,
            namespace: scheduledAction.scheduledAction.namespace
        });

        // Assert entry published
        const publishedEntryResult = await getEntryById.execute(
            modelResult.value,
            entryResult.value.id
        );

        expect(publishedEntryResult.value.status).toBe("published");

        // Schedule entry for unpublishing
        const unpublishActionResult = await scheduleUnpublish.execute({
            id: entryResult.value.id,
            model: modelResult.value,
            scheduleFor: new Date(Date.now() + 1000000)
        });

        // Execute action handler
        await executeScheduledAction.execute({
            id: unpublishActionResult.value.scheduledAction.id,
            namespace: unpublishActionResult.value.scheduledAction.namespace
        });

        const unpublishedEntryResult = await getEntryById.execute(
            modelResult.value,
            entryResult.value.id
        );

        expect(unpublishedEntryResult.value.status).toBe("unpublished");
    });
});
