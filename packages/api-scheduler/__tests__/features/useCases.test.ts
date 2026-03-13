import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/context/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "~/features/ListScheduledActions/index.js";
import { CancelScheduledActionUseCase } from "~/features/CancelScheduledAction/index.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";

describe("Combined Use Cases", () => {
    let context: CmsContext;

    const namespace = PublishTestEntryActionHandlerImpl.name;

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(NamespaceHandler);
        context.container.register(PublishTestEntryActionHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should resolve ScheduledActionModel from container", async () => {
        const resolved = context.container.resolve(ScheduleActionUseCase);

        expect(resolved.execute).toBeFunction();
    });

    it("should create, get, list, update and delete a scheduled action", async () => {
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);
        const getScheduledActionUseCase = context.container.resolve(GetScheduledActionUseCase);
        const listScheduledActionsUseCase = context.container.resolve(ListScheduledActionsUseCase);
        const cancelScheduledActionUseCase = context.container.resolve(
            CancelScheduledActionUseCase
        );

        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + 1);
        const updatedScheduledFor = new Date();
        updatedScheduledFor.setHours(updatedScheduledFor.getHours() + 2);

        const createResult = await scheduleActionUseCase.execute({
            namespace,
            actionType: "Publish",
            targetId: "target-id#0001",
            scheduleFor: scheduledFor.toISOString()
        });

        expect(createResult.isOk()).toBe(true);

        const getResult = await getScheduledActionUseCase.execute({
            namespace,
            id: createResult.value.id
        });

        expect(getResult.isOk()).toBeTrue();
        expect(getResult.value).toEqual({
            ...createResult.value
        });

        const updateResult = await scheduleActionUseCase.execute({
            namespace: PublishTestEntryActionHandlerImpl.name,
            actionType: "Publish",
            targetId: "target-id#0001",
            scheduleFor: updatedScheduledFor.toISOString()
        });

        expect(updateResult.isOk()).toBeTrue();
        expect(updateResult.value).toEqual({
            ...createResult.value,
            payload: {
                ...createResult.value.payload,
                scheduleFor: updatedScheduledFor.toISOString()
            },
            error: undefined,
            scheduledFor: updatedScheduledFor.toISOString()
        });

        const listResult = await listScheduledActionsUseCase.execute({
            where: {},
            sort: ["scheduledFor_DESC"]
        });

        expect(listResult.isOk()).toBeTrue();
        expect(listResult.value.items).toHaveLength(1);
        expect(listResult.value.items[0]).toEqual({
            ...updateResult.value
        });

        const cancelResult = await cancelScheduledActionUseCase.execute({
            id: updateResult.value.id,
            namespace
        });
        expect(cancelResult.isOk()).toBeTrue();

        const getAfterCancelResult = await getScheduledActionUseCase.execute({
            id: createResult.value.id,
            namespace
        });
        expect(getAfterCancelResult.isFail()).toBeTrue();
        expect(getAfterCancelResult.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });
});
