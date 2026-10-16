import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector } from "./ActiveReviewBlockCollector.js";
import { ActiveReviewGuard as Abstraction } from "./ActiveReviewGuard.js";
import type { ActiveReviewBulkParams } from "./ActiveReviewGuard.js";
import type { ActiveReviewGuardParams } from "./ActiveReviewGuard.js";
import type { ActiveReviewWarningDialogParams } from "./ActiveReviewGuard.js";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "./constants.js";
import { distinctReviewTargets } from "./distinctReviewTargets.js";
import { mergeBlockingReviews } from "./mergeBlockingReviews.js";
import { parseActiveReviewOnTrash } from "./parseActiveReviewOnTrash.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";

/*
 * What the dialog's `execute` hands back. `Confirmation.confirm` resolves only after `execute`
 * returns, so `execute` never throws: it reports a failure here and the guard rethrows it once
 * `confirm` has resolved.
 */
interface RetrySucceeded<TResult> {
    failed: false;
    value: TResult;
}

interface RetryFailed {
    failed: true;
    error: unknown;
}

type RetryOutcome<TResult> = RetrySucceeded<TResult> | RetryFailed;

class ActiveReviewGuardImpl implements Abstraction.Interface {
    constructor(
        private confirmation: Confirmation.Interface,
        private collector: ActiveReviewBlockCollector.Interface,
        private notifications: Notifications.Interface
    ) {}

    async run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false> {
        const { action, useCases, revisionId } = params;

        try {
            return await action();
        } catch (error) {
            const data = parseActiveReviewOnTrash(error);
            if (!data) {
                throw error;
            }

            if (this.collector.collects(data)) {
                // An active bulk run owns this target: record it for `runBulk` and report "not done".
                this.collector.add(data);
                return false;
            }

            const dialogParams: ActiveReviewWarningDialogParams = {
                reviews: data.reviews,
                action: data.action
            };
            const targets = distinctReviewTargets(data.reviews);

            const outcome = await this.confirmation.confirm<
                void,
                ActiveReviewWarningDialogParams,
                RetryOutcome<TResult>
            >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
                try {
                    for (const target of targets) {
                        await useCases.cancelForDelete({
                            namespace: target.model,
                            targetId: target.targetId,
                            targetRevisionId: revisionId,
                            action: data.action
                        });
                    }

                    const value = await action();
                    return { failed: false, value };
                } catch (retryError) {
                    return { failed: true, error: retryError };
                }
            });

            if (outcome === false) {
                return false;
            }
            if (outcome.failed) {
                throw outcome.error;
            }

            return outcome.value;
        }
    }

    async runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void> {
        const { items, getTargetId, run, useCases } = params;

        const targetIds = items.map(getTargetId);
        const runId = this.collector.begin(targetIds);
        let collected: ActiveReviewOnTrashData[] = [];

        try {
            await run(items, false);
        } finally {
            this.collector.end(runId);
            collected = this.collector.drain(runId);
        }

        if (collected.length === 0) {
            return;
        }

        const reviews = mergeBlockingReviews(collected);
        const action = collected[0].action;
        const blockedIds = reviews.map(review => review.targetId);
        const blockedTargetIds = new Set(blockedIds);
        const retryItems = items.filter(item => {
            const targetId = getTargetId(item);
            return blockedTargetIds.has(targetId);
        });
        const retryTargetIds = retryItems.map(getTargetId);
        const refused = retryItems.length;
        const done = items.length - refused;
        this.notifications.warning({
            title: `${done} of ${items.length} items done. ${refused} still need your confirmation.`,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
        const targets = distinctReviewTargets(reviews);
        const dialogParams: ActiveReviewWarningDialogParams = { reviews, action };

        const outcome = await this.confirmation.confirm<
            void,
            ActiveReviewWarningDialogParams,
            RetryOutcome<void>
        >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
            try {
                for (const target of targets) {
                    await useCases.cancelForDelete({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }

                const retryRunId = this.collector.begin(retryTargetIds);
                try {
                    await run(retryItems, true);
                } finally {
                    this.collector.end(retryRunId);
                    this.collector.drain(retryRunId);
                }

                return { failed: false, value: undefined };
            } catch (retryError) {
                return { failed: true, error: retryError };
            }
        });

        if (outcome === false) {
            return;
        }
        if (outcome.failed) {
            throw outcome.error;
        }
    }
}

export const ActiveReviewGuard = Abstraction.createImplementation({
    implementation: ActiveReviewGuardImpl,
    dependencies: [Confirmation, ActiveReviewBlockCollector, Notifications]
});
