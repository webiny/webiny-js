import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface TakeOverWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    /** D111: whether the previous owner is told; omitted means true. */
    notifyPreviousOwner?: boolean;
}

export interface ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    takeOver: TakeOverReviewStepUseCase.Error;
}

type UseCaseError =
    ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors[keyof ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors];

export interface ITakeOverWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: TakeOverWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take over a human page review step held by someone else (spec 5.1, D9, D32): read access to the target here, the step rules in the engine. */
export const TakeOverWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<ITakeOverWebsiteBuilderPageReviewStepUseCase>(
        "TakeOverWebsiteBuilderPageReviewStepUseCase"
    );

export namespace TakeOverWebsiteBuilderPageReviewStepUseCase {
    export type Interface = ITakeOverWebsiteBuilderPageReviewStepUseCase;
    export type Input = TakeOverWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
