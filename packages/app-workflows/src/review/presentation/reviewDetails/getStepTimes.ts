import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";
import { formatTimeOfDay } from "../time/formatTimeOfDay.js";

const isSameDay = (first: Date, second: Date): boolean => {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
};

/*
 * "Reached 6 Oct, 10:41 · started 11:05 · finished 11:20" (QBZ-54): the date once when start and
 * finish fall on the day of "reached". `null` for a step that was not reached or whose reached
 * date is unparsable; an unparsable started or finished date is left out. Pure.
 */
export const getStepTimes = (step: ReviewStep, now: Date): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = new Date(step.reachedOn);
    const reachedText = formatReviewTime(step.reachedOn, now);
    if (reachedText === "") {
        return null;
    }
    let text = `Reached ${reachedText}`;

    const later: Array<[string, string | null]> = [
        ["started", step.startedOn],
        ["finished", step.finishedOn]
    ];
    later.forEach(([label, iso]) => {
        if (iso === null) {
            return;
        }
        const date = new Date(iso);
        if (isSameDay(date, reached)) {
            const time = formatTimeOfDay(date);
            text += ` · ${label} ${time}`;
            return;
        }
        const formatted = formatReviewTime(iso, now);
        if (formatted === "") {
            return;
        }
        text += ` · ${label} ${formatted}`;
    });

    return text;
};
