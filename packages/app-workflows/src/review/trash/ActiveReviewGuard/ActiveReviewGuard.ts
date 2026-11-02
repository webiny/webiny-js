import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { ActiveReviewBlockCollector } from "../ActiveReviewBlockCollector/abstractions.js";
import { ActiveReviewGuard as Abstraction } from "./abstractions.js";
import type { ActiveReviewBulkParams } from "./abstractions.js";
import type { ActiveReviewConfirmBlockingParams } from "./abstractions.js";
import type { ActiveReviewGuardParams } from "./abstractions.js";
import type { ActiveReviewWarningDialogParams } from "./abstractions.js";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "../constants.js";
import { distinctReviewTargets } from "../distinctReviewTargets.js";
import { mergeBlockingReviews } from "../mergeBlockingReviews.js";
import { parseActiveReviewOnTrash } from "../parseActiveReviewOnTrash.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";

/*
 * The dialog's `execute` throws on a failed cancel or repeat: `Confirmation` then rejects the
 * dialog's `onConfirm`, so the dialog stays open with the error, and `confirm` resolves only on a
 * later successful confirm or on cancel (`false`).
 */
class ActiveReviewGuardImpl implements Abstraction.Interface {
    constructor(
        private cancelReviewsForDeleteUseCase: CancelReviewsForDeleteUseCase.Interface,
        private confirmation: Confirmation.Interface,
        private collector: ActiveReviewBlockCollector.Interface,
        private notifications: Notifications.Interface
    ) {}

    async run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false> {
        const { action, revisionId } = params;

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

            return this.confirmation.confirm<void, ActiveReviewWarningDialogParams, TResult>(
                ACTIVE_REVIEW_WARNING_DIALOG,
                dialogParams,
                async () => {
                    for (const target of targets) {
                        await this.cancelReviewsForDeleteUseCase.execute({
                            namespace: target.model,
                            targetId: target.targetId,
                            targetRevisionId: revisionId,
                            action: data.action
                        });
                    }

                    return action();
                }
            );
        }
    }

    async runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void> {
        const { items, getTargetId, run } = params;

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
        const afterCancel = async (): Promise<void> => {
            const retryRunId = this.collector.begin(retryTargetIds);
            try {
                await run(retryItems, true);
            } finally {
                this.collector.end(retryRunId);
                this.collector.drain(retryRunId);
            }
        };

        await this.confirmBlocking({ reviews, action, afterCancel });
    }

    async confirmBlocking(params: ActiveReviewConfirmBlockingParams): Promise<boolean> {
        const { reviews, action, afterCancel } = params;

        const targets = distinctReviewTargets(reviews);
        const dialogParams: ActiveReviewWarningDialogParams = { reviews, action };

        return this.confirmation.confirm<void, ActiveReviewWarningDialogParams, boolean>(
            ACTIVE_REVIEW_WARNING_DIALOG,
            dialogParams,
            async () => {
                for (const target of targets) {
                    await this.cancelReviewsForDeleteUseCase.execute({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }

                await afterCancel();

                return true;
            }
        );
    }
}

export const ActiveReviewGuard = Abstraction.createImplementation({
    implementation: ActiveReviewGuardImpl,
    dependencies: [
        CancelReviewsForDeleteUseCase,
        Confirmation,
        ActiveReviewBlockCollector,
        Notifications
    ]
});
