import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

/*
 * The hover text of a step's "Times" line: every event with its full date, time and timezone.
 * `null` for a step that was not reached or whose reached date is unparsable; an unparsable
 * started or finished date is left out. Pure.
 */
export const getStepTimesTitle = (step: ReviewStep): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = formatReviewTimeFull(step.reachedOn);
    if (reached === "") {
        return null;
    }
    const parts = [`Reached ${reached}`];
    if (step.startedOn !== null) {
        const started = formatReviewTimeFull(step.startedOn);
        if (started !== "") {
            parts.push(`Started ${started}`);
        }
    }
    if (step.finishedOn !== null) {
        const finished = formatReviewTimeFull(step.finishedOn);
        if (finished !== "") {
            parts.push(`Finished ${finished}`);
        }
    }
    return parts.join(" · ");
};
