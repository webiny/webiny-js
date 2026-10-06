import type { ComponentResult } from "./componentGeneration.js";

/**
 * Why a planned component has no output, for the Generate artifact and the reports read from it.
 *
 * Three different things, kept apart because they call for different responses: nothing was attempted
 * (no reference image — a capture or crop problem, and no model call was paid for), every attempt was
 * made and failed (a generation problem), or the component's task never recorded a result at all (an
 * infrastructure problem — a timeout or a task that died).
 */
export const noOutputReason = (stored: Pick<ComponentResult, "notGenerated"> | null): string => {
    if (!stored) {
        return "no result recorded: the component task did not finish";
    }
    return stored.notGenerated
        ? `not generated: ${stored.notGenerated}`
        : "every generation attempt failed";
};
