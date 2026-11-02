import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface RejectWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IRejectWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    reject: RejectReviewStepUseCase.Error;
}

type UseCaseError =
    IRejectWebsiteBuilderPageReviewStepUseCaseErrors[keyof IRejectWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IRejectWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: RejectWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Reject the page review step the user owns (spec 5.1, D10): read access here, ownership in the engine. */
export const RejectWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IRejectWebsiteBuilderPageReviewStepUseCase>(
        "RejectWebsiteBuilderPageReviewStepUseCase"
    );

export namespace RejectWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IRejectWebsiteBuilderPageReviewStepUseCase;
    export type Input = RejectWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
