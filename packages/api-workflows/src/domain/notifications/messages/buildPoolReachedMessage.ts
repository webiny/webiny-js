import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface PoolReachedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** `review.createdBy.displayName`. */
    requester: string;
}

/** A step reached the team pool (R189, `poolReached`). */
export const buildPoolReachedMessage = (params: PoolReachedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, requester } = params;
    return {
        title: `“${contentTitle}” is waiting in the team pool`,
        body: `${stepTitle} · requested by ${requester}`,
        subject: `Team pool: ${contentTitle} (${stepTitle})`,
        text: `“${stepTitle}” is waiting in the team pool. Anyone in the team can start it.`,
        linkLabel: "Open content"
    };
};
