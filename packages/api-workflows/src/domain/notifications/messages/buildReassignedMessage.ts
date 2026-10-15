import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface ReassignedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who reassigned (`getActorName`). */
    operator: string;
    /** The new owner's display name. */
    newOwner: string;
}

/** The old owner of a reassigned step (R189, `reassigned`). */
export const buildReassignedMessage = (params: ReassignedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, operator, newOwner } = params;
    return {
        title: `“${contentTitle}” was reassigned to ${newOwner}`,
        body: `${stepTitle} · reassigned by ${operator}. You no longer own this step.`,
        subject: `Reassigned: ${contentTitle} (${stepTitle})`,
        text: `${operator} reassigned this step to ${newOwner}. You don’t need to review it any more.`,
        linkLabel: "Open content"
    };
};
