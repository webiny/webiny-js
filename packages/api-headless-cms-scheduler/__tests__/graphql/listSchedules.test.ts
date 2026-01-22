import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/__mocks/context/useHandler.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { createHeadlessCmsScheduler } from "~/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler";
import { createMockTargetModelPlugins, MOCK_TARGET_MODEL_ID } from "~tests/__mocks/targetModel.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ScheduleEntryActionUseCase } from "~/features/ScheduleEntryAction/index.js";

describe("List schedules GraphQL", () => {
    const handler = useHandler({
        plugins: [createHeadlessCmsScheduler(), createMockTargetModelPlugins()],
        getScheduleClient: () => {
            return createMockScheduleClient();
        }
    });

    let context: CmsContext;

    beforeEach(async () => {
        context = await handler.handler();
    });

    beforeEach(async () => {});

    it.skip("should not list anything because there is no items in the database", async () => {
        const listScheduledActions = context.container.resolve(ListScheduledActionsUseCase);
        const result = await listScheduledActions.execute({
            where: {},
            sort: ["scheduledFor_ASC"]
        });

        expect(result.isOk()).toBeTrue();
        expect(result.value.items).toHaveLength(0);
    });

    const titles = ["First entry", "Second entry", "Third entry", "Fourth entry", "Fifth entry"];

    it("should list scheduled actions", async () => {
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const scheduleEntryAction = context.container.resolve(ScheduleEntryActionUseCase);
        const listScheduledActions = context.container.resolve(ListScheduledActionsUseCase);

        const modelResult = await getModel.execute(MOCK_TARGET_MODEL_ID);
        const ids: string[] = [];
        for (const title of titles) {
            const result = await createEntry.execute(modelResult.value, {
                values: {
                    title
                }
            });
            ids.push(result.value.id);
        }
        for (const id of ids) {
            // Schedule entry for publishing
            await scheduleEntryAction.execute({
                modelId: MOCK_TARGET_MODEL_ID,
                targetId: id,
                actionType: "Publish",
                scheduleFor: new Date(Date.now() + 100000).toISOString()
            });
        }
        const result = await listScheduledActions.execute({
            where: {},
            sort: ["scheduledFor_ASC"]
        });
        expect(result.isFail()).toBeFalse();
        expect(result.isOk()).toBeTrue();
        expect(result.value).toMatchObject({
            items: titles.map(title => {
                return {
                    title,
                    id: expect.stringMatching(`wby-schedule`)
                };
            })
        });
    });
});
