import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createMockScheduleClient } from "./__mocks/scheduleClient.js";
import { createWebsiteBuilderScheduler } from "~/index.js";
import { SchedulePageActionUseCase } from "~/features/SchedulePageAction/index.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/abstractions.js";
import { PublishPageUseCase } from "@webiny/api-website-builder/features/pages/PublishPage/abstractions.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler";

describe("Cancel on Change", () => {
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

    it("should auto-cancel a scheduled publish when a page is manually published", async () => {
        const container = context.container;

        const createPage = container.resolve(CreatePageUseCase);
        const publishPage = container.resolve(PublishPageUseCase);
        const schedulePageAction = container.resolve(SchedulePageActionUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);

        // Create a page.
        const createResult = await createPage.execute({
            properties: {
                title: "Cancel Test Page",
                path: "/cancel-test-page"
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

        // Schedule page for publishing.
        const scheduleResult = await schedulePageAction.execute({
            targetId: page.id,
            actionType: "Publish",
            scheduleFor: new Date(Date.now() + 100000).toISOString()
        });

        expect(scheduleResult.isFail()).toBe(false);

        // Assert 1 scheduled action exists.
        const beforeActions = await listScheduledActions.execute({
            where: { namespace: "Wb/Page" }
        });
        expect(beforeActions.value.items).toHaveLength(1);

        // Manually publish the page — should trigger auto-cancel.
        const publishResult = await publishPage.execute({ id: page.id });
        expect(publishResult.isFail()).toBe(false);

        // Assert the scheduled action was auto-cancelled.
        const afterActions = await listScheduledActions.execute({
            where: { namespace: "Wb/Page" }
        });
        expect(afterActions.value.items).toHaveLength(0);
    });
});
