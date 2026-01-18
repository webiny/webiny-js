import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase } from "@webiny/api-scheduler/features/CancelScheduledAction";
import { CancelScheduledEntryActionUseCase as UseCaseAbstraction } from "./abstractions.js";

/**
 * Cancels a scheduled CMS entry action
 */
class CancelScheduledEntryActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private cancelScheduledAction: CancelScheduledActionUseCase.Interface) {}

    async execute(scheduleId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const cancelRes = await this.cancelScheduledAction.execute(scheduleId);
        if (cancelRes.isFail()) {
            return Result.fail(cancelRes.error);
        }
        return Result.ok();
    }
}

export const CancelScheduledEntryActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledEntryActionUseCaseImpl,
    dependencies: [CancelScheduledActionUseCase]
});
