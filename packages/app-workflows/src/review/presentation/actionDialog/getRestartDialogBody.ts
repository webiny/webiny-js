import type { ReviewStep } from "~/review/domain/types.js";
import { formatTimeOfDay } from "~/review/presentation/time/formatTimeOfDay.js";

const RESTART_NOTE = "Restarting runs the step again from the beginning.";

/*
 * The body of the restart dialog (R266, R264): the end of the last attempt (the step's
 * `finishedOn`) and the reason (the step's `comment`) when they are known. Four texts, from the
 * design's editor text down to the one derived string of 8b. Pure.
 */
export const getRestartDialogBody = (step: ReviewStep | undefined): string => {
    let reason = "";
    let failedAt = "";
    if (step && step.comment !== null) {
        reason = step.comment.trim();
    }
    if (step && step.finishedOn !== null) {
        failedAt = formatTimeOfDay(new Date(step.finishedOn));
    }

    if (failedAt !== "" && reason !== "") {
        return `Last attempt failed at ${failedAt}: ${reason}. ${RESTART_NOTE}`;
    }
    if (reason !== "") {
        return `Last attempt failed: ${reason}. ${RESTART_NOTE}`;
    }
    if (failedAt !== "") {
        return `Last attempt failed at ${failedAt}. ${RESTART_NOTE}`;
    }
    return `Last attempt failed. ${RESTART_NOTE}`;
};
