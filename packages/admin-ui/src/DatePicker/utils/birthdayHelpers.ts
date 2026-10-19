/**
 * Logic for the step-by-step birthday picker: the date is picked as day, then month, then year.
 * Months are 1-based throughout (1 = January).
 */

export interface BirthdayParts {
    day?: number;
    month?: number;
    year?: number;
}

export type BirthdayStep = "day" | "month" | "year";

export const DEFAULT_BIRTHDAY_YEARS_BACK = 120;

/** The first and last date the picker may produce. Either may be left open. */
export interface BirthdayLimits {
    minDate?: Date;
    maxDate?: Date;
}

/** The dates the picker may produce: one of the offered years, within the limits. */
export interface BirthdayRange extends BirthdayLimits {
    years: number[];
}

const ALL_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * Reads the day, month and year from a `YYYY-MM-DD` value. A value that carries a time
 * (`2026-05-01T00:00:00.000Z`) still yields its date part. Anything else yields no parts.
 */
export function parseBirthdayValue(value: string | undefined | null): BirthdayParts {
    if (!value) {
        return {};
    }
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
        return {};
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(month, year)) {
        return {};
    }
    return { day, month, year };
}

/**
 * Returns the `YYYY-MM-DD` value, or `undefined` while any part is still missing.
 */
export function formatBirthdayValue(parts: BirthdayParts): string | undefined {
    const { day, month, year } = parts;
    if (day === undefined || month === undefined || year === undefined) {
        return undefined;
    }
    return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

export function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Days in a month. Without a year, February counts 29 days, because the year is picked
 * after the month and a leap year may still be chosen.
 */
export function daysInMonth(month: number, year?: number): number {
    if (month === 2) {
        return year === undefined || isLeapYear(year) ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function dateKey(year: number, month: number, day: number): number {
    return year * 10000 + month * 100 + day;
}

/** The calendar day of a limit, in local time, the same day the calendar picker compares. */
function limitKey(date: Date | undefined, open: number): number {
    if (!date || isNaN(date.getTime())) {
        return open;
    }
    return dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function limitYear(date: Date | undefined): number | undefined {
    return date && !isNaN(date.getTime()) ? date.getFullYear() : undefined;
}

/**
 * Whether the range holds a date with every part set in `parts`. An unset year is looked
 * for among the offered years; an unset month or day can be any.
 */
export function isInBirthdayRange(parts: BirthdayParts, range: BirthdayRange): boolean {
    const min = limitKey(range.minDate, -Infinity);
    const max = limitKey(range.maxDate, Infinity);
    const years = parts.year !== undefined ? [parts.year] : range.years;
    const months = parts.month !== undefined ? [parts.month] : ALL_MONTHS;
    for (const year of years) {
        if (dateKey(year, 12, 31) < min || dateKey(year, 1, 1) > max) {
            continue;
        }
        for (const month of months) {
            const last = daysInMonth(month, year);
            const first = parts.day ?? 1;
            const final = parts.day ?? last;
            if (final > last) {
                continue;
            }
            if (dateKey(year, month, final) >= min && dateKey(year, month, first) <= max) {
                return true;
            }
        }
    }
    return false;
}

/** A day is unavailable when no date in the range falls on it. */
export function isDayDisabled(day: number, range?: BirthdayRange): boolean {
    return range !== undefined && !isInBirthdayRange({ day }, range);
}

/**
 * A month is unavailable when it can't hold the chosen day (31 rules out the 30-day months
 * and February), or when no date in the range has the chosen day in that month.
 */
export function isMonthDisabled(
    month: number,
    parts: BirthdayParts,
    range?: BirthdayRange
): boolean {
    if (parts.day !== undefined && parts.day > daysInMonth(month)) {
        return true;
    }
    return range !== undefined && !isInBirthdayRange({ day: parts.day, month }, range);
}

/**
 * A year is unavailable when it can't hold the chosen day and month (29 February in a
 * non-leap year), or when the date it makes falls outside the range.
 */
export function isYearDisabled(year: number, parts: BirthdayParts, range?: BirthdayRange): boolean {
    if (
        parts.day !== undefined &&
        parts.month !== undefined &&
        parts.day > daysInMonth(parts.month, year)
    ) {
        return true;
    }
    return (
        range !== undefined &&
        !isInBirthdayRange({ day: parts.day, month: parts.month, year }, range)
    );
}

/**
 * Picking a day clears whatever comes after it that can no longer hold it: the month when
 * the month is too short or the range has no such date, otherwise the year when only the
 * year is the problem (29 February, or a date past a limit).
 */
export function pickDay(parts: BirthdayParts, day: number, range?: BirthdayRange): BirthdayParts {
    const next: BirthdayParts = { ...parts, day };
    if (next.month !== undefined && isMonthDisabled(next.month, next, range)) {
        next.month = undefined;
    }
    if (next.year !== undefined && isYearDisabled(next.year, next, range)) {
        next.year = undefined;
    }
    return next;
}

/**
 * Picking a month keeps the day (only months that hold it can be picked) and clears the
 * year when that year can't hold the date.
 */
export function pickMonth(
    parts: BirthdayParts,
    month: number,
    range?: BirthdayRange
): BirthdayParts {
    const next: BirthdayParts = { ...parts, month };
    if (next.year !== undefined && isYearDisabled(next.year, next, range)) {
        next.year = undefined;
    }
    return next;
}

export function pickYear(parts: BirthdayParts, year: number): BirthdayParts {
    return { ...parts, year };
}

const BIRTHDAY_STEPS: BirthdayStep[] = ["day", "month", "year"];

/**
 * The step to show after a pick, or `undefined` when the picker should close. A missing part
 * comes first. Once the date is complete, the picker walks on to the steps after `current`
 * that weren't picked while it was open, so editing a saved date still goes day, month, year.
 */
export function nextBirthdayStep(
    parts: BirthdayParts,
    current: BirthdayStep,
    picked: ReadonlySet<BirthdayStep>
): BirthdayStep | undefined {
    const missing = BIRTHDAY_STEPS.find(step => parts[step] === undefined);
    if (missing) {
        return missing;
    }
    return BIRTHDAY_STEPS.slice(BIRTHDAY_STEPS.indexOf(current) + 1).find(
        step => !picked.has(step)
    );
}

/**
 * The years to offer, newest first. The default runs from this year back
 * `DEFAULT_BIRTHDAY_YEARS_BACK` years, moved and cut to fit the limits. A year already set
 * outside the range is added, so an existing value is never hidden.
 */
export function birthdayYears(
    yearRange?: [number, number],
    includeYear?: number,
    limits?: BirthdayLimits
): number[] {
    const [from, to] = yearRange ?? defaultBirthdayYearRange(limits);
    let start = Math.min(from, to);
    let end = Math.max(from, to);
    if (includeYear !== undefined) {
        start = Math.min(start, includeYear);
        end = Math.max(end, includeYear);
    }
    const years: number[] = [];
    for (let year = end; year >= start; year--) {
        years.push(year);
    }
    return years;
}

/**
 * From the latest allowed year down to the earliest. Without an upper limit the list starts at
 * this year (or the lower limit's year, if that's later); without a lower limit it ends
 * `DEFAULT_BIRTHDAY_YEARS_BACK` years before its start.
 */
function defaultBirthdayYearRange(limits?: BirthdayLimits): [number, number] {
    const minYear = limitYear(limits?.minDate);
    const maxYear = limitYear(limits?.maxDate);
    const to = maxYear ?? Math.max(new Date().getFullYear(), minYear ?? -Infinity);
    const from = minYear ?? to - DEFAULT_BIRTHDAY_YEARS_BACK;
    return [from, to];
}
