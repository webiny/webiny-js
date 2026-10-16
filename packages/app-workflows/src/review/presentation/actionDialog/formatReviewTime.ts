const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 24 * 60 * 60 * 1000;

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

const startOfDay = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * QBZ-54, in the viewer's timezone, 24-hour: "14:20" today, "Yesterday 14:20", "6 Oct, 14:20"
 * this year, "6 Oct 2025, 14:20" older. `now` is a parameter so the function stays pure.
 */
export const formatReviewTime = (iso: string, now: Date): string => {
    const date = new Date(iso);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const time = `${hours}:${minutes}`;
    const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY);

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
