import { getLocalDate } from "./getLocalDate.js";

// Today's `yyyy-MM-dd` in `timeZone` at `now`: the earliest pickable day (R319).
export const getTodayLocalDate = (now: number, timeZone: string): string => {
    const instant = new Date(now).toISOString();
    return getLocalDate(instant, timeZone);
};
