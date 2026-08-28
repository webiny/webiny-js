import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "./__mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import {
    ExecuteScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CMS_NAMESPACE } from "~/utils/namespace.js";
import {
    SchedulePublishEntryUseCase,
    ScheduleUnpublishEntryUseCase
} from "~/exports/api/cms/scheduler.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

describe("Non-root tenant scheduling", () => {
    let context: CmsContext;
    let model: CmsModel;
    let entryId: string;

    beforeEach(async () => {
        const contextHandler = useHandler({
            plugins: [createHeadlessCmsScheduler(), createMockTargetModelPlugins()]
        });
        context = await contextHandler.handler();

        const container = context.container;
        const getModel = container.resolve(GetModelUseCase);
        const createEntry = container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute(MOCK_TARGET_MODEL_ID);
        model = modelResult.value;

        const entryResult = await createEntry.execute(model, {
            values: { title: "Cross-tenant entry" }
        });

        expect(entryResult.value.status).toBe("draft");
        entryId = entryResult.value.id;
    });

    it("should publish an entry when scheduled from a non-root tenant", async () => {
        const container = context.container;
        const tenantContext = container.resolve(TenantContext);
        const identityContext = container.resolve(IdentityContext);
        const schedulePublish = container.resolve(SchedulePublishEntryUseCase);
        const listScheduledActions = container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);
        const getEntryById = container.resolve(GetEntryByIdUseCase);

        const publishResult = await schedulePublish.execute({
            id: entryId,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });

        expect(publishResult.isFail()).toBe(false);

        const listResult = await listScheduledActions.execute({
            where: { namespace_startsWith: CMS_NAMESPACE }
        });

        expect(listResult.value.items).toHaveLength(1);
        expect(listResult.value.items[0].title).toBe("Cross-tenant entry");

        const item = listResult.value.items[0];
        await executeScheduledAction.execute({
            id: item.id,
            tenant: "root",
            namespace: item.namespace
        });

        await identityContext.withoutAuthorization(async () => {
            const entryResult = await getEntryById.execute(model, entryId);
            expect(entryResult.value.status).toBe("published");
        });
    });

    it("should unpublish an entry when scheduled from a non-root tenant", async () => {
        const container = context.container;
        const identityContext = container.resolve(IdentityContext);
        const schedulePublish = container.resolve(SchedulePublishEntryUseCase);
        const scheduleUnpublish = container.resolve(ScheduleUnpublishEntryUseCase);
        const executeScheduledAction = container.resolve(ExecuteScheduledActionUseCase);
        const getEntryById = container.resolve(GetEntryByIdUseCase);

        const publishResult = await schedulePublish.execute({
            id: entryId,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });

        expect(publishResult.isFail()).toBe(false);

        await executeScheduledAction.execute({
            id: publishResult.value.scheduledAction.id,
            tenant: "root",
            namespace: publishResult.value.scheduledAction.namespace
        });

        await identityContext.withoutAuthorization(async () => {
            const published = await getEntryById.execute(model, entryId);
            expect(published.value.status).toBe("published");
        });

        const unpublishResult = await scheduleUnpublish.execute({
            id: entryId,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 1000000)
        });

        expect(unpublishResult.isFail()).toBe(false);

        await executeScheduledAction.execute({
            id: unpublishResult.value.scheduledAction.id,
            tenant: "root",
            namespace: unpublishResult.value.scheduledAction.namespace
        });

        await identityContext.withoutAuthorization(async () => {
            const unpublished = await getEntryById.execute(model, entryId);
            expect(unpublished.value.status).toBe("unpublished");
        });
    });
});
