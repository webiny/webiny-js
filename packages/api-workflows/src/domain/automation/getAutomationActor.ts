import type { Actor } from "~/domain/review/types.js";

/**
 * The actor of an automation step (spec 5.2, D58, D107, R141): the requester's id and name with
 * the `automation` type, so the step's owner, its approve and reject facts and its `fail` facts
 * say who the automation acts for. `identityType` is omitted: an automation is not an identity.
 * Pure.
 */
export const getAutomationActor = (requester: Actor): Actor => {
    return {
        type: "automation",
        id: requester.id,
        displayName: requester.displayName
    };
};
