import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface TakeOverCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    /** D111: whether the previous owner is told; omitted means true. */
    notifyPreviousOwner?: boolean;
}

export interface ITakeOverCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    takeOver: TakeOverReviewStepUseCase.Error;
}

type UseCaseError =
    ITakeOverCmsEntryReviewStepUseCaseErrors[keyof ITakeOverCmsEntryReviewStepUseCaseErrors];

export interface ITakeOverCmsEntryReviewStepUseCase {
    execute(input: TakeOverCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take over a human CMS review step held by someone else (spec 5.1, D9, D32): read access to the target here, the step rules in the engine. */
export const TakeOverCmsEntryReviewStepUseCase =
    createAbstraction<ITakeOverCmsEntryReviewStepUseCase>("TakeOverCmsEntryReviewStepUseCase");

export namespace TakeOverCmsEntryReviewStepUseCase {
    export type Interface = ITakeOverCmsEntryReviewStepUseCase;
    export type Input = TakeOverCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
