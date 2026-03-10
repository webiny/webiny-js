import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { createWebsiteBuilderScheduler } from "~/index.js";
import { SchedulePageActionUseCase } from "~/features/SchedulePageAction/index.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/abstractions.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/abstractions.js";
import { ExecuteScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

describe("Action Handlers", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            plugins: [createWebsiteBuilderScheduler()],
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
    });

    it("should publish and unpublish a page", async () => {
        const container = context.container;

        const createPage = container.resolve(CreatePageUseCase);
        const getPageById = container.resolve(GetPageByIdUseCase);
        const schedulePageAction = container.resolve(SchedulePageActionUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);

        // Create a page.
        const createResult = await createPage.execute({
            properties: {
                title: "Test Page",
                path: "/test-page"
            },
            metadata: {},
            bindings: {},
            elements: [],
            location: {
                folderId: "root"
            }
        });

        expect(createResult.isFail()).toBe(false);
        const page = createResult.value;
        expect(page.status).toBe("draft");

        // Schedule page for publishing.
        const publishActionResult = await schedulePageAction.execute({
            targetId: page.id,
            actionType: "Publish",
            scheduleFor: new Date(Date.now() + 100000).toISOString()
        });

        expect(publishActionResult.isFail()).toBe(false);

        // Assert scheduled actions.
        const actionsResponse = await listScheduledActions.execute({
            where: {
                namespace: "Wb/Page"
            }
        });

        expect(actionsResponse.value.items).toHaveLength(1);
        expect(actionsResponse.value.items[0].title).toBe("Test Page");

        // Execute the scheduled action.
        const scheduledAction = publishActionResult.value;
        await executeScheduledAction.execute(scheduledAction.id);

        // Assert page published.
        const publishedPageResult = await getPageById.execute(page.id);
        expect(publishedPageResult.isFail()).toBe(false);
        expect(publishedPageResult.value.status).toBe("published");

        // Schedule page for unpublishing.
        const unpublishActionResult = await schedulePageAction.execute({
            targetId: page.id,
            actionType: "Unpublish",
            scheduleFor: new Date(Date.now() + 1000000).toISOString()
        });

        expect(unpublishActionResult.isFail()).toBe(false);

        // Execute action handler.
        await executeScheduledAction.execute(unpublishActionResult.value.id);

        const unpublishedPageResult = await getPageById.execute(page.id);
        expect(unpublishedPageResult.isFail()).toBe(false);
        expect(unpublishedPageResult.value.status).toBe("unpublished");
    });
});
