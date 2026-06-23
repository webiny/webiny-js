import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { createWebsiteBuilderScheduler } from "~/index.js";
import {
    CreatePageUseCase,
    GetPageByIdUseCase
} from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    ExecuteScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { WEBSITE_BUILDER_NAMESPACE } from "~/constants.js";
import {
    SchedulePublishPageUseCase,
    ScheduleUnpublishPageUseCase
} from "~/exports/api/website-builder/scheduler.js";

describe("Page Action Handlers", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const contextHandler = useHandler({
            plugins: [createWebsiteBuilderScheduler()]
        });
        context = await contextHandler.handler();
    });

    it("should publish a page", async () => {
        const container = context.container;

        const createPage = container.resolve(CreatePageUseCase);
        const getPageById = container.resolve(GetPageByIdUseCase);
        const schedulePublishPage = container.resolve(SchedulePublishPageUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);

        const pageResult = await createPage.execute({
            properties: { title: "First page" },
            metadata: {},
            bindings: {},
            elements: {},
            location: { folderId: "root" }
        });

        expect(pageResult.isFail()).toBe(false);
        const page = pageResult.value!;

        const publishActionResult = await schedulePublishPage.execute({
            id: page.id,
            scheduleFor: new Date(Date.now() + 100000)
        });

        expect(publishActionResult.isFail()).toBe(false);

        const actionsResponse = await listScheduledActions.execute({
            where: { namespace_startsWith: WEBSITE_BUILDER_NAMESPACE }
        });

        expect(actionsResponse.value.items).toHaveLength(1);
        expect(actionsResponse.value.items[0].title).toBe("First page");

        await executeScheduledAction.execute({
            id: publishActionResult.value!.scheduledAction.id,
            namespace: publishActionResult.value!.scheduledAction.namespace
        });

        const publishedPage = await getPageById.execute(page.id);
        expect(publishedPage.value!.status).toBe("published");
    });

    it("should unpublish a page", async () => {
        const container = context.container;

        const createPage = container.resolve(CreatePageUseCase);
        const getPageById = container.resolve(GetPageByIdUseCase);
        const schedulePublishPage = container.resolve(SchedulePublishPageUseCase);
        const scheduleUnpublishPage = container.resolve(ScheduleUnpublishPageUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);

        const pageResult = await createPage.execute({
            properties: { title: "Second page" },
            metadata: {},
            bindings: {},
            elements: {},
            location: { folderId: "root" }
        });

        const page = pageResult.value!;

        const publishResult = await schedulePublishPage.execute({
            id: page.id,
            scheduleFor: new Date(Date.now() + 100000)
        });
        await executeScheduledAction.execute({
            id: publishResult.value!.scheduledAction.id,
            namespace: publishResult.value!.scheduledAction.namespace
        });

        const publishedPage = await getPageById.execute(page.id);
        expect(publishedPage.value!.status).toBe("published");

        const unpublishResult = await scheduleUnpublishPage.execute({
            id: page.id,
            scheduleFor: new Date(Date.now() + 1000000)
        });
        await executeScheduledAction.execute({
            id: unpublishResult.value!.scheduledAction.id,
            namespace: unpublishResult.value!.scheduledAction.namespace
        });

        const unpublishedPage = await getPageById.execute(page.id);
        expect(unpublishedPage.value!.status).toBe("unpublished");
    });
});
