import { clampComment } from "~/domain/notifications/clampComment.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface RejectedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who rejected (`getActorName`): a person's name, or the step title for AI and automation. */
    decider: string;
    /** The rejection comment; a reject always has one (D100). Clamped here (R189a). */
    comment: string;
}

/** The requester's review was rejected (D107, R189, `rejected`). */
export const buildRejectedMessage = (params: RejectedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, decider } = params;
    const comment = clampComment(params.comment);
    return {
        title: `“${contentTitle}” was rejected at ${stepTitle}`,
        body: `${decider}: “${comment}”. Create a new revision to fix it.`,
        subject: `Rejected: ${contentTitle} (${stepTitle})`,
        text: `${decider} rejected this revision at ${stepTitle}: “${comment}”. This revision can’t be changed; create a new revision, fix it and request a new review.`,
        linkLabel: "Open content"
    };
};
