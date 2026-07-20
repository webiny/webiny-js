const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
});

/**
 * Formats a scheduled action's go-live date/time using the browser's locale. Mirrors the
 * formatting used in the schedule dialog so the label reads consistently across the UI.
 */
export const formatScheduledDate = (date: Date): string => {
    return formatter.format(date);
};
