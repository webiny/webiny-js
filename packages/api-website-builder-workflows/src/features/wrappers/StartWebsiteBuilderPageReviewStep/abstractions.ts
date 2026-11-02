import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface StartWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IStartWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    start: StartReviewStepUseCase.Error;
}

type UseCaseError =
    IStartWebsiteBuilderPageReviewStepUseCaseErrors[keyof IStartWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IStartWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: StartWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take an awaiting page review step from the pool (spec 5.1): read access to the target here, team membership and "not the requester" in the engine. */
export const StartWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IStartWebsiteBuilderPageReviewStepUseCase>(
        "StartWebsiteBuilderPageReviewStepUseCase"
    );

export namespace StartWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IStartWebsiteBuilderPageReviewStepUseCase;
    export type Input = StartWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
