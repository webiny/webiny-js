/*
 * Local midnight of `date` (`yyyy-MM-dd`) in the browser: the date picker's `minDate`, because the
 * picker's calendar compares browser-local days (R337). The browser's zone is the viewer's zone
 * the page uses, except when that is the `UTC` fallback.
 */
export const toLocalMidnight = (date: string): Date => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
};
