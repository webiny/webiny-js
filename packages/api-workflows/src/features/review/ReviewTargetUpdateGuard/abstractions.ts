import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetLockedError } from "~/domain/review/errors.js";
import type { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";
import type { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";

export interface ReviewTargetUpdateGuardParams {
    /** Namespace id of the target, for example `cms.article` or `wb.page`. */
    model: string;
    /** The revision being updated. */
    targetRevisionId: string;
}

type GuardError =
    | ReviewTargetLockedError
    | GetBoundWorkflowUseCase.Error
    | GetTargetReviewUseCase.Error;

export interface IReviewTargetUpdateGuard {
    /**
     * Ok when the revision may be updated. Fails with `ReviewTargetLockedError` when it has an
     * active review on a bound namespace, or with the lookup's error when a lookup fails.
     */
    check(params: ReviewTargetUpdateGuardParams): Promise<Result<void, GuardError>>;
}

/**
 * The save block shared by the app adapters (spec 9.2, D62, D80, D134, R54): on a namespace bound
 * to a workflow, a revision with an active review cannot be updated, including an approved or
 * rejected one. Unbound namespaces never look up reviews, and failed lookups block the update.
 * The automation run is exempt (D36, D62, R150): while `WorkflowBypassService.isActive()` the
 * check passes before the binding lookup. Internal (D132): no permission checks; the adapters'
 * update handlers call it and throw its error.
 */
export const ReviewTargetUpdateGuard =
    createAbstraction<IReviewTargetUpdateGuard>("ReviewTargetUpdateGuard");

export namespace ReviewTargetUpdateGuard {
    export type Interface = IReviewTargetUpdateGuard;
    export type Params = ReviewTargetUpdateGuardParams;
    export type Error = GuardError;
    export type Return = Promise<Result<void, GuardError>>;
}
