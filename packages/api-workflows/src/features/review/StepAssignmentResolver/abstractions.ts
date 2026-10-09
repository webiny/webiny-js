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
}

export interface IStepAssignmentResolver {
    resolve(params: StepAssignmentResolverParams): Promise<StepAssignmentResolution>;
}

/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). 1a registers a pool-only
 * resolver; phase 4 replaces it with picks, rules and strategies.
 */
export const StepAssignmentResolver =
    createAbstraction<IStepAssignmentResolver>("StepAssignmentResolver");

export namespace StepAssignmentResolver {
    export type Interface = IStepAssignmentResolver;
    export type Params = StepAssignmentResolverParams;
    export type Resolution = StepAssignmentResolution;
}
