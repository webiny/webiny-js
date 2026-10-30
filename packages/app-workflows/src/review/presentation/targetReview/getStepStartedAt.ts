import type { ReviewStep } from "~/review/domain/types.js";
import { formatTimeOfDay } from "../time/formatTimeOfDay.js";

/*
 * The "hh:mm" the current attempt of a step started at, in the viewer's timezone; `null` without
 * a start time or with an unparsable one. Pure.
 */
export const getStepStartedAt = (step: ReviewStep): string | null => {
    if (step.startedOn === null) {
        return null;
    }
    const started = new Date(step.startedOn);
    if (Number.isNaN(started.getTime())) {
        return null;
    }
    return formatTimeOfDay(started);
};
