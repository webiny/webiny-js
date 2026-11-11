import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import type { NotificationIdentity } from "@webiny/notifications/api/domain/notification/abstractions.js";

/**
 * Who the inbox names as having decided a step. An AI or automation actor carries the requester's
 * id and name (D58), so it is named by the step title instead (D107): the requester did not
 * decide.
 */
export const toNotificationActor = (actor: Actor, stepTitle: string): NotificationIdentity => {
    if (actor.type === "user") {
        return {
            id: actor.id,
            displayName: actor.displayName,
            type: actor.identityType ?? "admin"
        };
    }
    return { id: actor.id, displayName: stepTitle, type: actor.type };
};
