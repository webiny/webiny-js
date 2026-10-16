import { startOfDay } from "../time/startOfDay.js";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
 * "Just now", "12 min ago", "3 h ago", "Yesterday", "n days ago" (README 8). A date in the future
 * (clock skew) reads "Just now"; an unparsable date reads as an empty string.
 */
export const formatLastChange = (isoDate: string, now: Date): string => {
    const changed = new Date(isoDate);
    const elapsed = now.getTime() - changed.getTime();

    if (Number.isNaN(elapsed)) {
        return "";
    }
    if (elapsed < MINUTE) {
        return "Just now";
    }
    if (elapsed < HOUR) {
        return `${Math.floor(elapsed / MINUTE)} min ago`;
    }
    if (elapsed < DAY) {
        return `${Math.floor(elapsed / HOUR)} h ago`;
    }

    const startOfNow = startOfDay(now);
    const startOfChanged = startOfDay(changed);
    const days = Math.round((startOfNow - startOfChanged) / DAY);
    if (days <= 1) {
        return "Yesterday";
    }
    return `${days} days ago`;
};
