import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

/** The hover text of a step's "Times" line: every event with its full date, time and timezone. Pure. */
export const getStepTimesTitle = (step: ReviewStep): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = formatReviewTimeFull(step.reachedOn);
    const parts = [`Reached ${reached}`];
    if (step.startedOn !== null) {
        const started = formatReviewTimeFull(step.startedOn);
        parts.push(`Started ${started}`);
    }
    if (step.finishedOn !== null) {
        const finished = formatReviewTimeFull(step.finishedOn);
        parts.push(`Finished ${finished}`);
    }
    return parts.join(" · ");
};
