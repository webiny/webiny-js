import { ScheduleUnpublishRedirectUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import { SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";

class ScheduleUnpublishRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private scheduleAction: ScheduleActionUseCase.Interface) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Result {
        const scheduleResult = await this.scheduleAction.execute({
            namespace: createNamespace(SCHEDULED_ACTION_TYPE_REDIRECT),
            actionType: "unpublish",
            scheduleFor: params.scheduleFor,
            targetId: params.id
        });
        if (scheduleResult.isFail()) {
            return Result.fail(scheduleResult.error);
        }
        return Result.ok({ scheduledAction: scheduleResult.value });
    }
}

export const ScheduleUnpublishRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: ScheduleUnpublishRedirectUseCaseImpl,
    dependencies: [ScheduleActionUseCase]
});
