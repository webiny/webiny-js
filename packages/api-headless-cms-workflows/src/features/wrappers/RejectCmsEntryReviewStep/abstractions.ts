import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface RejectCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IRejectCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    reject: RejectReviewStepUseCase.Error;
}

type UseCaseError =
    IRejectCmsEntryReviewStepUseCaseErrors[keyof IRejectCmsEntryReviewStepUseCaseErrors];

export interface IRejectCmsEntryReviewStepUseCase {
    execute(input: RejectCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Reject the CMS review step the user owns (spec 5.1, D10): read access here, ownership in the engine. */
export const RejectCmsEntryReviewStepUseCase = createAbstraction<IRejectCmsEntryReviewStepUseCase>(
    "RejectCmsEntryReviewStepUseCase"
);

export namespace RejectCmsEntryReviewStepUseCase {
    export type Interface = IRejectCmsEntryReviewStepUseCase;
    export type Input = RejectCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
