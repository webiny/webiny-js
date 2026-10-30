import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ReassignWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    /** The admin user who gets the step; validated like a pick by the engine (R112). */
    userId: string;
}

export interface IReassignWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    reassign: ReassignReviewStepUseCase.Error;
}

type UseCaseError =
    IReassignWebsiteBuilderPageReviewStepUseCaseErrors[keyof IReassignWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IReassignWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: ReassignWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Give a page review step to another team member (spec 5.1, D25, D33, R119): read access to the
 * page and `reassign` here, the step and the chosen user's rules in the engine.
 */
export const ReassignWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IReassignWebsiteBuilderPageReviewStepUseCase>(
        "ReassignWebsiteBuilderPageReviewStepUseCase"
    );

export namespace ReassignWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IReassignWebsiteBuilderPageReviewStepUseCase;
    export type Input = ReassignWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
