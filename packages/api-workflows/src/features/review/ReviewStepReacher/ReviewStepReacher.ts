import { Result } from "@webiny/feature/api";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { ReviewStepReacher as Abstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements Abstraction.Interface {
    constructor(private stepTypes: StepTypeRegistryService.Interface) {}

    async reach(params: Abstraction.Params): Promise<Result<void, Abstraction.Error>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }

        const stepType = this.stepTypes.get(step.type);
        if (!stepType) {
            // A workflow saved before its step type was removed keeps running from its snapshot
            // (A53), so an unregistered type fails the step instead of leaving it pending.
            const failed = params.review.fail({
                stepId: step.id,
                reason: `The step type "${step.type}" is not available.`,
                now: params.now
            });
            // Whatever `fail` returns is returned, never ignored (R159).
            if (failed.isFail()) {
                return Result.fail(failed.error);
            }
            return Result.ok();
        }

        return stepType.reach({
            review: params.review,
            step,
            actor: params.actor,
            now: params.now
        });
    }
}

export const ReviewStepReacher = Abstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepTypeRegistryService]
});
