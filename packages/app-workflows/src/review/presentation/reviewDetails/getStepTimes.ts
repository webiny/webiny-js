import type { ReviewStep } from "~/review/domain/types.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

const isSameDay = (first: Date, second: Date): boolean => {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
};

/**
 * "Reached 6 Oct, 10:41 · started 11:05 · finished 11:20" (QBZ-54): the date once when start and
 * finish fall on the day of "reached". `null` for a step that was not reached. Pure.
 */
export const getStepTimes = (step: ReviewStep, now: Date): string | null => {
    if (step.reachedOn === null) {
        return null;
    }

    const reached = new Date(step.reachedOn);
    let text = `Reached ${formatReviewTime(step.reachedOn, now)}`;

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
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            text += ` · ${label} ${hours}:${minutes}`;
            return;
        }
        const formatted = formatReviewTime(iso, now);
        text += ` · ${label} ${formatted}`;
    });

    return text;
};
