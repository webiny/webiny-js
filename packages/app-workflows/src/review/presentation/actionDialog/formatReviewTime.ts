import { formatTimeOfDay } from "../time/formatTimeOfDay.js";
import { startOfDay } from "../time/startOfDay.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 24 * 60 * 60 * 1000;

/*
 * QBZ-54, in the viewer's timezone, 24-hour: "14:20" today, "Yesterday 14:20", "6 Oct, 14:20"
 * this year, "6 Oct 2025, 14:20" older. `now` is a parameter so the function stays pure. An
 * unparsable date reads as an empty string.
 */
export const formatReviewTime = (iso: string, now: Date): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    const time = formatTimeOfDay(date);
    const startOfNow = startOfDay(now);
    const startOfDate = startOfDay(date);
    const days = Math.round((startOfNow - startOfDate) / DAY);

    if (days === 0) {
        return time;
    }
    if (days === 1) {
        return `Yesterday ${time}`;
    }

    const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
    if (date.getFullYear() === now.getFullYear()) {
        return `${day}, ${time}`;
    }
    return `${day} ${date.getFullYear()}, ${time}`;
};
