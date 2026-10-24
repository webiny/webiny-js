import { Result } from "@webiny/feature/api";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { ReviewStepReacher as ReviewStepReacherAbstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements ReviewStepReacherAbstraction.Interface {
    constructor(private stepTypes: StepTypeRegistryService.Interface) {}

    async reach(
        params: ReviewStepReacherAbstraction.Params
    ): Promise<Result<void, ReviewStepReacherAbstraction.Error>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }

        const stepType = this.stepTypes.get(step.type);
        if (!stepType) {
            // A workflow saved before its step type was removed keeps running from its snapshot
            // (A53), so an unregistered type fails the step instead of leaving it pending. Like a
            // run step that cannot start (R168), the step is reached first, without a task, so the
            // reach is recorded; the built-in review type is always registered, so this is a run
            // type and the requester's automation actor owns it.
            const reached = params.review.reachRun({
                actor: params.actor,
                owner: getAutomationActor(params.review.toData().createdBy),
                taskId: null,
                now: params.now
            });
            if (reached.isFail()) {
                return Result.fail(reached.error);
            }
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

export const ReviewStepReacher = ReviewStepReacherAbstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepTypeRegistryService]
});
