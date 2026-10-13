import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ReassignCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    /** The admin user who gets the step; validated like a pick by the engine (R112). */
    userId: string;
}

export interface IReassignCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    reassign: ReassignReviewStepUseCase.Error;
}

type UseCaseError =
    IReassignCmsEntryReviewStepUseCaseErrors[keyof IReassignCmsEntryReviewStepUseCaseErrors];

export interface IReassignCmsEntryReviewStepUseCase {
    execute(input: ReassignCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Give a CMS review step to another team member (spec 5.1, D25, D33, R119): read access to the
 * target and `reassign` here, the step and the chosen user's rules in the engine.
 */
export const ReassignCmsEntryReviewStepUseCase =
    createAbstraction<IReassignCmsEntryReviewStepUseCase>("ReassignCmsEntryReviewStepUseCase");

export namespace ReassignCmsEntryReviewStepUseCase {
    export type Interface = IReassignCmsEntryReviewStepUseCase;
    export type Input = ReassignCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
