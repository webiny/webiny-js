import type { TestRoutingInput } from "./TestRoutingInput.js";

/*
 * The design prototype's signature (R300): a result is out of date when this string of the
 * current input differs from the one taken when the request was sent.
 */
export const getTestRoutingSignature = (input: TestRoutingInput): string => {
    return JSON.stringify([
        input.stepId,
        input.teams,
        input.strategy,
        input.allowManualPick,
        input.rules,
        input.requesterId,
        input.folderId
    ]);
};
