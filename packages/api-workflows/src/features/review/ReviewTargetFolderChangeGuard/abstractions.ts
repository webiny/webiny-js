import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewTargetLockedError } from "~/domain/review/errors.js";
import type { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";
import type { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";

export interface ReviewTargetFolderChangeGuardParams {
    /** Namespace id of the target, for example `cms.article` or `wb.page`. */
    model: string;
    /** The target (entry or page) whose folder the update changes. */
    targetId: string;
}

type GuardError =
    | ReviewTargetLockedError
    | GetBoundWorkflowUseCase.Error
    | ListTargetReviewsUseCase.Error;

export interface IReviewTargetFolderChangeGuard {
    /**
     * Ok when the target may change folder. Fails with `ReviewTargetLockedError` when any of its
     * revisions has an in-progress review on a bound namespace, or with the lookup's error when a
     * lookup fails.
     */
    check(params: ReviewTargetFolderChangeGuardParams): Promise<Result<void, GuardError>>;
}

/**
 * The move rule applied to updates, shared by the app adapters (D84, R55, A24). An update can
 * relocate the target without a move event, and the save block only checks the updated revision,
 * so a folder change is refused like a move while any review of the target (any revision) is in
 * progress. The adapters call it only when the update changes the folder. Unlike the save block
 * it does not honour the bypass. Internal (D132): no permission checks; the adapters' update
 * handlers call it and throw its error.
 */
export const ReviewTargetFolderChangeGuard = createAbstraction<IReviewTargetFolderChangeGuard>(
    "ReviewTargetFolderChangeGuard"
);

export namespace ReviewTargetFolderChangeGuard {
    export type Interface = IReviewTargetFolderChangeGuard;
    export type Params = ReviewTargetFolderChangeGuardParams;
    export type Error = GuardError;
    export type Return = Promise<Result<void, GuardError>>;
}
