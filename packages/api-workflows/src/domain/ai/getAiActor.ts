import type { Actor } from "~/domain/review/types.js";

/**
 * The actor of an AI step (spec 5.2, D58, D107, R164): the requester's id and name with the `ai`
 * type, so the step's owner, its approve and reject facts and its `fail` facts say who the AI acts
 * for. `identityType` is omitted: an AI step is not an identity (R141 mirror). Pure.
 */
export const getAiActor = (requester: Actor): Actor => {
    return {
        type: "ai",
        id: requester.id,
        displayName: requester.displayName
    };
};
