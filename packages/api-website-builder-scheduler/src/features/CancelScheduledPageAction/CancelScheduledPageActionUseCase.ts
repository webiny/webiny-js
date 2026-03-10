import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase } from "@webiny/api-scheduler/features/CancelScheduledAction";
import { CancelScheduledPageActionUseCase as UseCaseAbstraction } from "./abstractions.js";

/**
 * Cancels a scheduled WB page action.
 */
class CancelScheduledPageActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private cancelScheduledAction: CancelScheduledActionUseCase.Interface) {}

    async execute(scheduleId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const cancelRes = await this.cancelScheduledAction.execute(scheduleId);
        if (cancelRes.isFail()) {
            return Result.fail(cancelRes.error);
        }
        return Result.ok();
    }
}

export const CancelScheduledPageActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledPageActionUseCaseImpl,
    dependencies: [CancelScheduledActionUseCase]
});
