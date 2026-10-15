import {
    REVIEW_CANCEL_REASON_CONTENT_DELETED,
    REVIEW_CANCEL_REASON_CONTENT_TRASHED
} from "~/domain/review/getDeleteCancelReason.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface CancelledMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who cancelled (`getActorName`). */
    canceller: string;
    /**
     * `fact.reason` of the cancel: the trashed and deleted constants have their own text, `null`
     * and any other reason the normal one. The reason itself is never printed (R146 mirror).
     */
    reason: string | null;
}

/** The owner of a step whose review was cancelled (D134, R189, `cancelled`). */
export const buildCancelledMessage = (params: CancelledMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, canceller, reason } = params;
    const title = `The review of “${contentTitle}” was cancelled`;
    const subject = `Review cancelled: ${contentTitle}`;

    if (reason === REVIEW_CANCEL_REASON_CONTENT_TRASHED) {
        return {
            title,
            body: `The content was moved to the trash. You no longer need to review ${stepTitle}.`,
            subject,
            text: `The content was moved to the trash, so this review was cancelled. You don’t need to review ${stepTitle} any more.`,
            linkLabel: "Open content"
        };
    }
    if (reason === REVIEW_CANCEL_REASON_CONTENT_DELETED) {
        return {
            title,
            body: `The content was deleted. You no longer need to review ${stepTitle}.`,
            subject,
            text: `The content was deleted, so this review was cancelled. You don’t need to review ${stepTitle} any more.`,
            linkLabel: "Open content"
        };
    }
    return {
        title,
        body: `Cancelled by ${canceller}. You no longer need to review ${stepTitle}.`,
        subject,
        text: `${canceller} cancelled this review. You don’t need to review ${stepTitle} any more.`,
        linkLabel: "Open content"
    };
};
