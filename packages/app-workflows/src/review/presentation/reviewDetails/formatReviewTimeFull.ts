const FORMAT = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short"
});

/*
 * The hover text of every time (QBZ-54): the full date and time with its timezone in the
 * viewer's locale settings, e.g. "Tue 6 Oct 2026, 14:20 CEST". An unparsable date reads as an
 * empty string. Pure.
 */
export const formatReviewTimeFull = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    const formatted = FORMAT.format(date);
    return formatted.replace(",", "");
};
