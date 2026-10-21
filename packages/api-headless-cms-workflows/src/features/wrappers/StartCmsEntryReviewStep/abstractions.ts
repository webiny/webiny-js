import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface StartCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IStartCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    start: StartReviewStepUseCase.Error;
}

type UseCaseError =
    IStartCmsEntryReviewStepUseCaseErrors[keyof IStartCmsEntryReviewStepUseCaseErrors];

export interface IStartCmsEntryReviewStepUseCase {
    execute(input: StartCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take an awaiting CMS review step from the pool (spec 5.1): read access to the target here, team membership and "not the requester" in the engine. */
export const StartCmsEntryReviewStepUseCase = createAbstraction<IStartCmsEntryReviewStepUseCase>(
    "StartCmsEntryReviewStepUseCase"
);

export namespace StartCmsEntryReviewStepUseCase {
    export type Interface = IStartCmsEntryReviewStepUseCase;
    export type Input = StartCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
