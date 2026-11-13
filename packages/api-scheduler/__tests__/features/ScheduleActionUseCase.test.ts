import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "~/shared/abstractions.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/index.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { SchedulerPermissions } from "~tests/__mocks/SchedulerPermissions.js";
import { SCHEDULED_ACTION_PUBLISH } from "~/constants.js";

describe("ScheduleActionUseCase", () => {
    let context: CmsContext;

    const params = {
        tenant: "root",
        namespace: PublishTestEntryActionHandlerImpl.name,
        actionType: SCHEDULED_ACTION_PUBLISH,
        targetId: "target-id#0001"
    };

    beforeEach(async () => {
        const contextHandler = useHandler({
            getScheduleClient: () => {
                return createMockScheduleClient();
            }
        });
        context = await contextHandler.handler();
        context.container.register(NamespaceHandler);
        context.container.register(SchedulerPermissions);
        context.container.register(PublishTestEntryActionHandler);
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());
    });

    it("should fail when there is no schedule date and the action is not immediate", async () => {
        const result = await context.container.resolve(ScheduleActionUseCase).execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatchObject({
            code: "Scheduler/ScheduledAction/InvalidDate",
            message: "A valid schedule date is required",
            data: { scheduleFor: null }
        });
    });

    it("should fail when the schedule date is in the past", async () => {
        const scheduleFor = new Date(Date.now() - 60000);

        const result = await context.container.resolve(ScheduleActionUseCase).execute({
            ...params,
            scheduleFor
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatchObject({
            code: "Scheduler/ScheduledAction/InvalidDate",
            message: "Cannot schedule in the past",
            data: { scheduleFor: scheduleFor.toISOString() }
        });
    });

    it("should schedule an immediate action without a schedule date", async () => {
        const result = await context.container.resolve(ScheduleActionUseCase).execute({
            ...params,
            immediately: true
        });

        expect(result.isOk()).toBe(true);
    });
});
