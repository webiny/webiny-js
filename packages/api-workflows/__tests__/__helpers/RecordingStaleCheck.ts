import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";

/** `WorkflowBypassService.isActive()` at every `isStale` call. Clear it per test. */
export const staleCheckBypassStates: boolean[] = [];

class RecordingStaleCheckImpl implements StepRunStaleCheckService.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private decoratee: StepRunStaleCheckService.Interface
    ) {}

    public async isStale(
        params: StepRunStaleCheckService.Params
    ): Promise<Result<boolean, ReviewPersistenceError>> {
        staleCheckBypassStates.push(this.bypass.isActive());
        return this.decoratee.isStale(params);
    }
}

export const RecordingStaleCheck = StepRunStaleCheckService.createDecorator({
    decorator: RecordingStaleCheckImpl,
    dependencies: [WorkflowBypassService]
});
