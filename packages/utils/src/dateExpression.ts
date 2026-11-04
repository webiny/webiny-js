/**
 * Date expressions: a date written relative to today, like `today-18y` or `today+1d`.
 *
 * Syntax: `today`, or `today` plus or minus a whole number of days (`d`), months (`m`) or
 * years (`y`), with one offset. Spaces around the parts are allowed (`today - 18y`). The
 * offset can be at most 1000 years: `1000y`, `12000m` or `366000d`.
 *
 * Dates are `YYYY-MM-DD` strings. Adding months or years keeps the day of the month where it
 * can, and otherwise uses the month's last day: 31 March minus one month is 28 (or 29)
 * February, and 29 February minus 18 years is 28 February.
 */

/** A date limit: a fixed date, or an expression worked out from today. */
export type DateBound = string | { expression: string };

export type DateExpressionUnit = "d" | "m" | "y";

export interface ParsedDateExpression {
    /** Signed offset from today; `0` for plain `today`. */
    amount: number;
    unit: DateExpressionUnit;
}

const DATE_EXPRESSION = /^\s*today\s*(?:([+-])\s*(\d+)\s*([dmy]))?\s*$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const RESOLVED_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The largest offset per unit, about 1000 years, so a worked-out date stays a 4-digit year. */
const MAX_AMOUNT: Record<DateExpressionUnit, number> = {
    d: 366000,
    m: 12000,
    y: 1000
};

/**
 * The most a date can differ from UTC: the earliest timezone is UTC-12, the latest UTC+14.
 * At any moment, the calendar date somewhere on Earth lies between these two.
 */
const EARLIEST_OFFSET_HOURS = -12;
const LATEST_OFFSET_HOURS = 14;

export function parseDateExpression(expression: string): ParsedDateExpression | null {
    if (typeof expression !== "string") {
        return null;
    }
    const match = expression.match(DATE_EXPRESSION);
    if (!match) {
        return null;
    }
    const [, sign, amount, unit] = match;
    if (!sign) {
        return { amount: 0, unit: "d" };
    }
    const value = Number(amount);
    if (value > MAX_AMOUNT[unit as DateExpressionUnit]) {
        return null;
    }
    return {
        amount: sign === "-" ? -value : value,
        unit: unit as DateExpressionUnit
    };
}

export function isDateExpression(expression: string): boolean {
    return parseDateExpression(expression) !== null;
}

/**
 * Works out an expression against `today` (`YYYY-MM-DD`). Throws when the expression or
 * `today` can't be read.
 */
export function resolveDateExpression(expression: string, today: string): string {
    const parsed = parseDateExpression(expression);
    if (!parsed) {
        throw new Error(
            `Invalid date expression "${expression}". Use "today", or "today" plus or minus a number of days, months or years, like "today-18y".`
        );
    }
    const match = today.match(ISO_DATE);
    if (!match) {
        throw new Error(`Invalid date "${today}". Expected YYYY-MM-DD.`);
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const resolved = resolveParsed(parsed, year, month, day);
    if (!RESOLVED_DATE.test(resolved)) {
        throw new Error(
            `Date expression "${expression}" on ${today} gives a date out of range. Use a smaller offset.`
        );
    }
    return resolved;
}

function resolveParsed(
    parsed: ParsedDateExpression,
    year: number,
    month: number,
    day: number
): string {
    switch (parsed.unit) {
        case "d":
            return formatUtcDate(new Date(Date.UTC(year, month - 1, day + parsed.amount)));
        case "m":
            return addMonths(year, month, day, parsed.amount);
        case "y":
            return addMonths(year, month, day, parsed.amount * 12);
    }
}

/** Today's date in the timezone of the machine running the code. */
export function getLocalToday(now: Date = new Date()): string {
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

/**
 * "Today" for a check on a server that can't know the user's timezone. A lower limit
 * (`dateGte`) uses the earliest date anywhere on Earth, an upper limit (`dateLte`) the latest,
 * so a date the user's own "today" allows always passes. The limit can be beaten by up to a
 * day.
 */
export function getLenientToday(limit: "gte" | "lte", now: Date = new Date()): string {
    const hours = limit === "gte" ? EARLIEST_OFFSET_HOURS : LATEST_OFFSET_HOURS;
    return formatUtcDate(new Date(now.getTime() + hours * 60 * 60 * 1000));
}

/**
 * The date a bound stands for: a fixed date as it is, an expression worked out against
 * `today`. Throws when an expression can't be read.
 */
export function resolveDateBound(bound: DateBound, today: string): string {
    if (typeof bound === "string") {
        return bound;
    }
    return resolveDateExpression(bound.expression, today);
}

function addMonths(year: number, month: number, day: number, months: number): string {
    const index = year * 12 + (month - 1) + months;
    const targetYear = Math.floor(index / 12);
    const targetMonth = index - targetYear * 12 + 1;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    return formatParts(targetYear, targetMonth, Math.min(day, lastDay));
}

function formatUtcDate(date: Date): string {
    return formatParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function formatParts(year: number, month: number, day: number): string {
    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}
