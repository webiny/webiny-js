import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import type { NotificationIdentity } from "@webiny/notifications/api/domain/notification/abstractions.js";

/**
 * Who the inbox names as having decided a step. An AI or automation actor carries the requester's
 * id and name (D58), so it is named by its kind instead: the requester did not decide.
 */
const AUTOMATED_ACTOR_NAMES: Record<Exclude<Actor["type"], "user">, string> = {
    ai: "AI review",
    automation: "Automation"
};

export const toNotificationActor = (actor: Actor): NotificationIdentity => {
    if (actor.type === "user") {
        return {
            id: actor.id,
            displayName: actor.displayName,
            type: actor.identityType ?? "admin"
        };
    }
    return { id: actor.id, displayName: AUTOMATED_ACTOR_NAMES[actor.type], type: actor.type };
};
