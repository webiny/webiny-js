import { clampComment } from "~/domain/notifications/clampComment.js";
import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface RejectedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who rejected (`getActorName`): a person's name, or the step title for AI and automation. */
    decider: string;
    /** The rejection comment, if any; blank counts as none (D126). Clamped here (R189a). */
    comment: string | null;
}

/** The requester's review was rejected (D107, R189, `rejected`). */
export const buildRejectedMessage = (params: RejectedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, decider } = params;
    const comment = params.comment === null ? "" : clampComment(params.comment);
    if (comment === "") {
        const line =
            decider === stepTitle
                ? `Rejected at ${stepTitle}.`
                : `Rejected at ${stepTitle} by ${decider}.`;
        return {
            title: `“${contentTitle}” was rejected at ${stepTitle}`,
            body: line,
            subject: `Rejected: ${contentTitle} (${stepTitle})`,
            text: line,
            linkLabel: "Open content"
        };
    }
    return {
        title: `“${contentTitle}” was rejected at ${stepTitle}`,
        body: `${decider}: “${comment}”. Create a new revision to fix it.`,
        subject: `Rejected: ${contentTitle} (${stepTitle})`,
        text: `${decider} rejected this revision at ${stepTitle}: “${comment}”. This revision can’t be changed; create a new revision, fix it and request a new review.`,
        linkLabel: "Open content"
    };
};
