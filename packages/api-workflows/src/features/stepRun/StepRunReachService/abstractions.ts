import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";

export interface StepRunReachParams {
    review: Review;
    /** The pending step being reached. */
    step: ReviewStep;
    /** Who caused the step to be reached (the approver of the previous step, the restarter, ...). */
    actor: Actor;
    /** The step's owner once reached: the automation actor or the AI actor of the requester. */
    owner: Actor;
    now: string;
    /** A fixed reason when the step cannot be started: no task is triggered and the step fails with it. */
    failure: string | null;
    /** The fixed reason used when the trigger itself fails or throws (the raw error is only logged). */
    startFailure: string;
}

export type StepRunReachError = ReviewInvalidStateError | ReviewStepNotCurrentError;

export interface IStepRunReachService {
    /**
     * The one reach path of every step that runs as a `workflowsStepRun` task (R168): triggers the
     * task as the requester (R149), stores its id on the step through `review.reachRun`, aborts
     * the task when that fails (R143) and fails the step with a fixed reason when there is
     * nothing to run (R146). Returns the review's transition errors as they are (R159).
     */
    reach(params: StepRunReachParams): Promise<Result<void, StepRunReachError>>;
}

/**
 * Shared by `AutomationStepType.reach` and the AI step type's reach (R164, R168). Internal (D132):
 * no permission checks; the caller has already decided what can run.
 */
export const StepRunReachService = createAbstraction<IStepRunReachService>("StepRunReachService");

export namespace StepRunReachService {
    export type Interface = IStepRunReachService;
    export type Params = StepRunReachParams;
    export type Error = StepRunReachError;
}
