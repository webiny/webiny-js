import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface AssignedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /**
     * Why the step is the recipient's, already resolved by `getAssignmentReason`. Used when
     * `reassignedBy` is `null`; `null` reads "assigned to you".
     */
    reason: string | null;
    /**
     * The name of who reassigned the step to the recipient (`getActorName`), or `null` when the
     * step was reached by routing.
     */
    reassignedBy: string | null;
}

/** A user owns a step: reached by routing or reassigned to them (R189, `assigned`). */
export const buildAssignedMessage = (params: AssignedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, reason, reassignedBy } = params;
    const why =
        reassignedBy !== null
            ? `reassigned to you by ${reassignedBy}`
            : (reason ?? "assigned to you");
    return {
        title: `You’re reviewing “${contentTitle}”`,
        body: `${stepTitle} · ${why}`,
        subject: `You’re reviewing: ${contentTitle} (${stepTitle})`,
        text: `You are the owner of ${stepTitle}. Open the content to approve or reject it.`,
        linkLabel: "Open content"
    };
};
