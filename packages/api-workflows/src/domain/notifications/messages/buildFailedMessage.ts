import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface FailedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /**
     * `fact.reason` of the failed step: a fixed text that already ends in a full stop (R146,
     * R170). The only error text a message may hold (R146 mirror).
     */
    reason: string;
}

/** An AI or automation step failed; the requester is told (R189, `failed`). */
export const buildFailedMessage = (params: FailedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, reason } = params;
    return {
        title: `${stepTitle} failed on “${contentTitle}”`,
        body: `${reason} You can restart the step.`,
        subject: `Step failed: ${contentTitle} (${stepTitle})`,
        text: `${stepTitle} hit a technical error. ${reason} The review is paused at this step until it is restarted.`,
        linkLabel: "Open content"
    };
};
