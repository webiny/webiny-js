import type { Actor } from "~/domain/review/types.js";

/** A notification recipient, known by its id. */
export interface DropActorRecipient {
    id: string;
}

/**
 * Nobody is told about their own action (R184), but only a person's. An AI or an automation actor
 * carries the requester's id (D58), so it never drops the requester: the requester still hears
 * that the AI rejected the review. Returns a new array. Pure.
 */
export const dropActor = <T extends DropActorRecipient>(recipients: T[], actor: Actor): T[] => {
    if (actor.type !== "user") {
        return [...recipients];
    }
    return recipients.filter(recipient => recipient.id !== actor.id);
};
