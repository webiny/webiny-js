import { dropActor } from "~/domain/notifications/dropActor.js";
import type { Actor, ReviewData } from "~/domain/review/types.js";

/**
 * Who gets the silent `workflows.reviewChanged` message (R254): the requester and the current
 * owner when that is a user, each once, minus the actor when the actor is a user (`dropActor`, the
 * phase 7 rule). The actor's own tab refreshes through its own action. No pool lookup. An empty
 * or missing id is never a recipient. Pure.
 */
export const getReviewChangeRecipients = (review: ReviewData, actor: Actor): string[] => {
    const ids: string[] = [];
    for (const id of [review.createdBy.id, review.currentOwnerId]) {
        if (typeof id === "string" && id !== "" && !ids.includes(id)) {
            ids.push(id);
        }
    }

    const recipients = ids.map(id => ({ id }));
    const remaining = dropActor(recipients, actor);
    return remaining.map(item => item.id);
};
