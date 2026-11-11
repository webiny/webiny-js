import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ApproveWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IApproveWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    approve: ApproveReviewStepUseCase.Error;
}

type UseCaseError =
    IApproveWebsiteBuilderPageReviewStepUseCaseErrors[keyof IApproveWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IApproveWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: ApproveWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Approve the page review step the user owns (spec 5.1): read access here, ownership in the engine. */
export const ApproveWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IApproveWebsiteBuilderPageReviewStepUseCase>(
        "ApproveWebsiteBuilderPageReviewStepUseCase"
    );

export namespace ApproveWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IApproveWebsiteBuilderPageReviewStepUseCase;
    export type Input = ApproveWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
