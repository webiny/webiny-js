const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const startOfDay = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
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

    const days = Math.round((startOfDay(now) - startOfDay(changed)) / DAY);
    if (days <= 1) {
        return "Yesterday";
    }
    return `${days} days ago`;
};
