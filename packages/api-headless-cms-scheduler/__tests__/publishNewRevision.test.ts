import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./__mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "./__mocks/targetModel.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry";
import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById";
import { GetPublishedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId";
import {
    ExecuteScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { SchedulePublishEntryUseCase } from "~/exports/api/cms/scheduler.js";
import { CMS_NAMESPACE } from "~/utils/namespace.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

describe("scheduled publish of a new revision", () => {
    let context: CmsContext;
    let model: CmsModel;

    beforeEach(async () => {
        const contextHandler = useHandler({
            plugins: [createHeadlessCmsScheduler(), createMockTargetModelPlugins()]
        });
        context = await contextHandler.handler();
        const modelResult = await context.container
            .resolve(GetModelUseCase)
            .execute(MOCK_TARGET_MODEL_ID);
        model = modelResult.value;
    });

    const createPublishedEntryWithDraftRevision = async () => {
        const container = context.container;
        const createResult = await container.resolve(CreateEntryUseCase).execute(model, {
            values: { title: "Revision 1" }
        });
        const revision1 = createResult.value;
        const publishResult = await container
            .resolve(PublishEntryUseCase)
            .execute(model, revision1.id);
        expect(publishResult.isOk()).toBe(true);

        const revision2Result = await container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, revision1.id, { values: { title: "Revision 2" } });
        expect(revision2Result.isOk()).toBe(true);
        return { revision1, revision2: revision2Result.value };
    };

    const scheduleAndExecute = async (revisionId: string) => {
        const container = context.container;
        const scheduleResult = await container.resolve(SchedulePublishEntryUseCase).execute({
            id: revisionId,
            model,
            tenant: "root",
            scheduleFor: new Date(Date.now() + 100000)
        });
        expect(scheduleResult.isOk()).toBe(true);
        const { scheduledAction } = scheduleResult.value;

        return container.resolve(ExecuteScheduledActionUseCase).execute({
            id: scheduledAction.id,
            tenant: "root",
            namespace: scheduledAction.namespace
        });
    };

    const getPublishedRevisionId = async (entryId: string) => {
        const result = await context.container
            .resolve(GetPublishedRevisionByEntryIdUseCase)
            .execute(model, entryId);
        return result.isOk() ? result.value?.id : undefined;
    };

    it("should publish the new revision, unpublish the old one and remove the schedule", async () => {
        const { revision1, revision2 } = await createPublishedEntryWithDraftRevision();

        const executeResult = await scheduleAndExecute(revision2.id);
        expect(executeResult.isOk()).toBe(true);

        expect(await getPublishedRevisionId(revision1.entryId)).toBe(revision2.id);

        const getRevision = context.container.resolve(GetRevisionByIdUseCase);
        const revision1After = await getRevision.execute(model, revision1.id);
        expect(revision1After.value.status).toBe("unpublished");
        const revision2After = await getRevision.execute(model, revision2.id);
        expect(revision2After.value.status).toBe("published");

        const actions = await context.container.resolve(ListScheduledActionsUseCase).execute({
            where: { namespace_startsWith: CMS_NAMESPACE }
        });
        expect(actions.value.items).toHaveLength(0);
    });

    it("should keep the old revision published when publishing the new revision fails", async () => {
        const { revision1, revision2 } = await createPublishedEntryWithDraftRevision();

        context.container.registerInstance(EntryBeforePublishEventHandler, {
            handle: async () => {
                throw new Error("Simulated publish failure.");
            }
        });

        const executeResult = await scheduleAndExecute(revision2.id);
        expect(executeResult.isFail()).toBe(true);

        expect(await getPublishedRevisionId(revision1.entryId)).toBe(revision1.id);
    });
});
