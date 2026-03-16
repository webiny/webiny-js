import { SchedulePublishEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ScheduleActionUseCase } from "@webiny/api-scheduler";
import { createNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";

class SchedulePublishEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private scheduleAction: ScheduleActionUseCase.Interface) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Result {
        const { model, scheduleFor, id } = params;

        const scheduleResult = await this.scheduleAction.execute({
            namespace: createNamespace(model),
            actionType: "publish",
            scheduleFor,
            targetId: id
        });
        if (scheduleResult.isFail()) {
            return Result.fail(scheduleResult.error);
        }
        return Result.ok({
            scheduledAction: scheduleResult.value
        });
    }
}

export const SchedulePublishEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: SchedulePublishEntryUseCaseImpl,
    dependencies: [ScheduleActionUseCase]
});
