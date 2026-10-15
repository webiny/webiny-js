import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface ApprovedMessageParams {
    /** `review.title`. */
    contentTitle: string;
}

/** The requester's review is approved by every step (R189, `approved`). */
export const buildApprovedMessage = (params: ApprovedMessageParams): NotificationMessage => {
    const { contentTitle } = params;
    return {
        title: `“${contentTitle}” was approved`,
        body: "All steps approved. It’s ready to publish.",
        subject: `Approved: ${contentTitle}`,
        text: "Every step approved this revision. It’s ready to publish.",
        linkLabel: "Open content"
    };
};
