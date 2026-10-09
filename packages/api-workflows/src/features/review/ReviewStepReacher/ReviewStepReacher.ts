import { Result } from "@webiny/feature/api";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";
import { StepAssignmentResolver } from "../StepAssignmentResolver/abstractions.js";
import { ReviewStepReacher as Abstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements Abstraction.Interface {
    constructor(private resolver: StepAssignmentResolver.Interface) {}

    async reach(params: Abstraction.Params): Promise<Result<void, ReviewInvalidStateError>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }
        const resolution = await this.resolver.resolve({ review: params.review.toData(), step });
        return params.review.reach({ resolution, actor: params.actor, now: params.now });
    }
}

export const ReviewStepReacher = Abstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepAssignmentResolver]
});
