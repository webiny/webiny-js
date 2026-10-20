import type { ResolveEndsOnParams } from "./ResolveEndsOnParams.js";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";

/*
 * The `endsOn` a save sends (R319, D124): the stored string unchanged when the date was not
 * changed (also an end that is not at the end of a day, e.g. saved in another zone); `null` when
 * cleared; else the end of the newly picked day in the viewer's zone.
 */
export const resolveEndsOn = (params: ResolveEndsOnParams): string | null => {
    const { pickedDate, originalDate, originalEndsOn, timeZone } = params;

    if (pickedDate === null) {
        return null;
    }
    if (pickedDate === originalDate && originalEndsOn !== null) {
        return originalEndsOn;
    }
    return getEndOfLocalDay(pickedDate, timeZone);
};
