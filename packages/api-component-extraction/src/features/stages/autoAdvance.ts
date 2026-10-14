import { nextStage, type Stage } from "~/constants.js";
import { THEME_READING_STAGES, themeGateMessage } from "~/features/theme/themeStep.js";
import type { Job } from "~/domain/types.js";

export type AutoAdvance =
    /** Start this stage now. */
    | { kind: "advance"; next: Stage }
    /** The job pauses here: someone starts the next stage by hand. */
    | { kind: "gate"; next: Stage }
    /** The next stage reads the theme, which is not pinned yet. */
    | { kind: "waiting"; next: Stage; reason: string }
    /** The pipeline is over. */
    | { kind: "end" };

/**
 * What happens once a stage is done: start the next one, or stop.
 *
 * `gateConfig.stopAfter` is the set of stages the job pauses after, chosen when the job was created.
 * A stage outside it hands straight on to the next. The theme check mirrors the one on starting a
 * stage by hand: a stage that reads the theme cannot start before the job's theme is pinned, and
 * saying so beats a trigger that fails.
 */
export const decideAutoAdvance = (
    job: Pick<Job, "gateConfig" | "themeEntryId" | "themeExtraction">,
    finished: Stage
): AutoAdvance => {
    const next = nextStage(finished);
    if (!next) {
        return { kind: "end" };
    }
    if (job.gateConfig.stopAfter.includes(finished)) {
        return { kind: "gate", next };
    }
    if (THEME_READING_STAGES.has(next)) {
        const reason = themeGateMessage(job);
        if (reason) {
            return { kind: "waiting", next, reason };
        }
    }
    return { kind: "advance", next };
};
