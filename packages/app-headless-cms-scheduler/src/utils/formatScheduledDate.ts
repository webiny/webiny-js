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
 *
 * TODO: this absolute date/time format is duplicated in a few places (the schedule dialog's
 * `dateToLocaleStringFormatter`, `app-scheduler`'s `CellScheduledOn`, and here). Consolidate into a
 * single shared formatter/component (e.g. a `<FormattedDate>` alongside `TimeAgo` in
 * `@webiny/admin-ui`) so the wording stays consistent everywhere.
 */
export const formatScheduledDate = (date: Date): string => {
    return formatter.format(date);
};
