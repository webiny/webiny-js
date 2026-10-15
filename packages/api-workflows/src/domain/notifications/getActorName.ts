import type { Actor } from "~/domain/review/types.js";

/**
 * How a message names an actor (D107, D126, R189a): a person by their display name (a blank name
 * reads "A user"), an AI step or an automation by the step title, never by the model's or the
 * automation's own name. Pure.
 */
export const getActorName = (actor: Actor, stepTitle: string): string => {
    if (actor.type !== "user") {
        return stepTitle;
    }
    const name = actor.displayName.trim();
    return name === "" ? "A user" : name;
};
