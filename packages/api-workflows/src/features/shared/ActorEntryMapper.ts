import type { Actor, ActorType } from "~/domain/review/types.js";

/** How an `Actor` is stored in an object field of a private model. */
export interface ActorEntryValues {
    type: string;
    id: string;
    displayName: string;
    identityType: string | null;
}

/** Maps actors to and from object fields; used by the review and assignment-log mappers. */
export class ActorEntryMapper {
    public static toEntry(actor: Actor): ActorEntryValues {
        return {
            type: actor.type,
            id: actor.id,
            displayName: actor.displayName,
            identityType: actor.identityType ?? null
        };
    }

    public static fromEntry(value: ActorEntryValues | null | undefined): Actor | null {
        if (!value?.id) {
            return null;
        }
        return {
            type: value.type as ActorType,
            id: value.id,
            displayName: value.displayName ?? "",
            ...(value.identityType ? { identityType: value.identityType } : {})
        };
    }
}
