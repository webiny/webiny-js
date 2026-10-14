import type { RunDto } from "~/shared/types.js";
import { STAGES } from "~/constants.js";

const runningStage = (run: RunDto | null): string | null =>
    run?.stages.find(entry => entry.status === "running")?.stage ?? null;

/**
 * The stage the view should move to after a refresh, or null to stay where it is.
 *
 * A run hands itself on to the next stage when the job does not pause there, and nobody clicks
 * anything. A view left on the stage that just finished would then read "done" while the next one
 * runs out of sight, so progress only showed after picking the stage by hand. It follows the pipeline
 * when it was following it: the person is on the stage that was running, or on the one just before
 * the stage that started. Anyone looking at some other stage stays where they are.
 */
export const stageToFollow = (
    selected: string | null,
    before: RunDto | null,
    after: RunDto
): string | null => {
    const now = runningStage(after);
    if (!now || now === selected) {
        return null;
    }
    const was = runningStage(before);
    if (now === was) {
        return null;
    }
    const index = STAGES.indexOf(now as (typeof STAGES)[number]);
    const justBefore = index > 0 ? STAGES[index - 1] : null;
    return selected !== null && (selected === was || selected === justBefore) ? now : null;
};
