import { createAbstraction } from "@webiny/feature/admin";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
import type { IReviewCancelForDeleteUseCases } from "~/review/useCases/IReviewCancelForDeleteUseCases.js";

/*
 * Params of the warning dialog, handed over by the guard. A type alias on purpose:
 * `Confirmation.confirm` and `useNamedConfirmationDialog` constrain params to
 * `Record<string, unknown>`, which an interface does not satisfy.
 */
export type ActiveReviewWarningDialogParams = {
    reviews: BlockingReview[];
    action: ActiveReviewOnTrashData["action"];
};

export interface ActiveReviewGuardParams<TResult> {
    action: () => Promise<TResult>;
    useCases: IReviewCancelForDeleteUseCases;
    /*
     * The revision id of a single-revision delete, `null` for a trash or a whole-entry delete.
     */
    revisionId: string | null;
}

export interface ActiveReviewBulkParams<TItem> {
    items: TItem[];
    /*
     * The entry id (CMS) or page id (WB); equal to `BlockingReview.targetId`.
     */
    getTargetId: (item: TItem) => string;
    /*
     * Runs the presenter's series for a batch; `isRetry` is true for the second run.
     */
    run: (batch: TItem[], isRetry: boolean) => Promise<void>;
    useCases: IReviewCancelForDeleteUseCases;
}

export interface ActiveReviewConfirmBlockingParams {
    reviews: BlockingReview[];
    action: ReviewForDeleteAction;
    useCases: IReviewCancelForDeleteUseCases;
    /*
     * Runs inside the dialog's confirm, after every distinct target was cancelled.
     */
    afterCancel: () => Promise<void>;
}

export interface IActiveReviewGuard {
    /*
     * Runs the action; on the server refusal opens the warning, cancels on confirm and repeats
     * the action once. Resolves `false` when the warning is dismissed, and also when an active
     * bulk run owns the refused target (the refusal is then recorded for `runBulk`).
     */
    run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false>;
    /*
     * Runs a bulk series, collects the refusals of its own targets, warns once and retries only
     * the blocked items. Resolves after the warning flow has ended.
     */
    runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void>;
    /*
     * Opens the warning for reviews that are already known to block (a pre-check). On confirm it
     * cancels each distinct target (no revision) and runs `afterCancel`; it resolves `true` when
     * confirmed and done, `false` when the dialog is dismissed. An error of the cancel loop or of
     * `afterCancel` is rethrown after the dialog has closed.
     */
    confirmBlocking(params: ActiveReviewConfirmBlockingParams): Promise<boolean>;
}

export const ActiveReviewGuard = createAbstraction<IActiveReviewGuard>(
    "Workflows/ActiveReviewGuard"
);

export namespace ActiveReviewGuard {
    export type Interface = IActiveReviewGuard;
    export type Params<TResult> = ActiveReviewGuardParams<TResult>;
    export type BulkParams<TItem> = ActiveReviewBulkParams<TItem>;
    export type ConfirmBlockingParams = ActiveReviewConfirmBlockingParams;
    export type DialogParams = ActiveReviewWarningDialogParams;
}
