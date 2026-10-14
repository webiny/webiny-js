import { STAGES, type Stage } from "~/constants.js";

const isStage = (value: string): value is Stage => (STAGES as readonly string[]).includes(value);

/**
 * The stages a new job pauses after, from what the caller asked for.
 *
 * Left out, a job pauses after every stage: the safe default for a caller that never offered the
 * choice. An empty list is a choice, not an omission: run straight through. It used to fall back to
 * every stage as well, so a job created with no gate ticked still stopped at each one.
 */
export const resolveStopAfter = (requested: string[] | null | undefined): Stage[] => {
    if (requested === null || requested === undefined) {
        return [...STAGES];
    }
    return requested.filter(isStage);
};
