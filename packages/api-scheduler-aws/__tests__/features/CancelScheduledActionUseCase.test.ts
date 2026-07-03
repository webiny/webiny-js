import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { useHandler } from "~tests/__mocks/handler/useHandler.js";
import { createMockScheduleClient } from "~tests/__mocks/scheduleClient.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { CancelScheduledActionUseCase } from "@webiny/api-scheduler/features/CancelScheduledAction/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { Result } from "@webiny/feature/api/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import {
    PublishTestEntryActionHandler,
    PublishTestEntryActionHandlerImpl
} from "~tests/__mocks/PublishTestEntryActionHandler.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/features/ScheduleAction/index.js";
import { NamespaceHandler } from "~tests/__mocks/NamespaceHandler.js";
import { SCHEDULED_ACTION_PUBLISH } from "@webiny/api-scheduler/constants.js";

describe("CancelScheduledActionUseCase", () => {
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
        context.container.registerInstance(
            SchedulerService,
            new VoidSchedulerService({
                delete: async id => {
                    throw new Error(`Cannot delete mock: ${id}.`);
                }
            })
        );
    });

    it("should fail to cancel schedule because it does not exist", async () => {
        const cancelScheduledActionUseCase = context.container.resolve(
            CancelScheduledActionUseCase
        );

        const result = await cancelScheduledActionUseCase.execute({
            id: "non-existing-id",
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/ScheduledAction/NotFound");
    });

    it("should fail to delete entry when cancelling scheduled action", async () => {
        // fail the DeleteEntryUseCase
        context.container.registerInstance(
            DeleteEntryUseCase,
            new (class {
                public async execute() {
                    return Result.fail(
                        new EntryPersistenceError(
                            new Error("DeleteEntryUseCase is not implemented in this mock.")
                        )
                    );
                }
            })()
        );
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);
        const cancelScheduledActionUseCase = context.container.resolve(
            CancelScheduledActionUseCase
        );
        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + 1);

        const createResult = await scheduleActionUseCase.execute({
            namespace,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor: scheduledFor
        });

        expect(createResult.isOk()).toBe(true);

        const result = await cancelScheduledActionUseCase.execute({
            id: createResult.value.id,
            namespace
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Scheduler/ScheduledAction/PersistenceError");
    });

    it("should successfully cancel a scheduled action", async () => {
        const scheduleActionUseCase = context.container.resolve(ScheduleActionUseCase);
        const cancelScheduledActionUseCase = context.container.resolve(
            CancelScheduledActionUseCase
        );
        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + 1);

        const createResult = await scheduleActionUseCase.execute({
            namespace,
            actionType: SCHEDULED_ACTION_PUBLISH,
            targetId: "target-id#0001",
            scheduleFor: scheduledFor
        });

        expect(createResult.isOk()).toBeTrue();

        const result = await cancelScheduledActionUseCase.execute({
            id: createResult.value.id,
            namespace
        });

        expect(result.isOk()).toBeTrue();
        expect(result.value).toBeTrue();
    });
});
