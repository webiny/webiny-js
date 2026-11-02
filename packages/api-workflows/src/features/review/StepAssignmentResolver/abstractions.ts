import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData, ReviewStep, StepAssignmentResolution } from "~/domain/review/types.js";

/**
 * Resolvers must read the step being reached from `params.step`. The review-level current-step
 * fields on `params.review` (`currentStepId`, `currentStepState`, `currentOwnerId`,
 * `currentCandidateTeamIds`) still describe the previous step while a step is being reached.
 */
export interface StepAssignmentResolverParams {
    review: ReviewData;
    /** The review step being reached; carries `pickedUserId` and the step config. */
    step: ReviewStep;
    /**
     * The reach time (R118): exclusion expiry and the records' `assignedOn` use it. Routing never
     * calls `new Date()`.
     */
    now: Date;
}

export interface IStepAssignmentResolver {
    resolve(params: StepAssignmentResolverParams): Promise<StepAssignmentResolution>;
}

/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). The registered
 * implementation is `RoutingStepAssignmentResolver`: pick, rules, strategy, pool; any failure
 * falls through to the pool (R110, R116). A later registration wins on resolve.
 */
export const StepAssignmentResolver =
    createAbstraction<IStepAssignmentResolver>("StepAssignmentResolver");

export namespace StepAssignmentResolver {
    export type Interface = IStepAssignmentResolver;
    export type Params = StepAssignmentResolverParams;
    export type Resolution = StepAssignmentResolution;
}
