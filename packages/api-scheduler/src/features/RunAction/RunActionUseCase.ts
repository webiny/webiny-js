import { Result } from "@webiny/feature/api";
import { RunActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ScheduleActionUseCase } from "~/features/ScheduleAction/abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Schedules an action for immediate execution
 *
 * Flow:
 * 1. Calculate the closest possible execution time
 * 2. Delegate to ScheduleAction use case with calculated time
 *
 * Note: We add a small buffer to ensure EventBridge has time to process the schedule
 */
class RunActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private scheduleActionUseCase: ScheduleActionUseCase.Interface) {}

    async execute<T extends GenericRecord>(
        params: UseCaseAbstraction.Params<T>
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        // Delegate to ScheduleAction
        const result = await this.scheduleActionUseCase.execute({
            ...params,
            title: "Unknown title",
            // Calculate the soonest possible execution time.
            // Add at least 90 seconds of buffer to ensure EventBridge can process the schedule.
            scheduleFor: new Date(Date.now() + 90000).toISOString()
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const RunActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: RunActionUseCaseImpl,
    dependencies: [ScheduleActionUseCase]
});
