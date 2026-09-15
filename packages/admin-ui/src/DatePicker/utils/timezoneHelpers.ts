import { format } from "date-fns";

interface ParsedOffset {
    sign: number;
    minutes: number;
}

function parseOffset(tz: string): ParsedOffset | null {
    const match = tz.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) {
        return null;
    }
    const sign = match[1] === "+" ? 1 : -1;
    return { sign, minutes: sign * (Number(match[2]) * 60 + Number(match[3])) };
}

export function utcToTimezoneDate(utcDate: Date, timezone: string): Date {
    const parsed = parseOffset(timezone);
    if (!parsed) {
        return utcDate;
    }
    const localOffsetMinutes = -utcDate.getTimezoneOffset();
    const shiftMs = (parsed.minutes - localOffsetMinutes) * 60 * 1000;
    return new Date(utcDate.getTime() + shiftMs);
}

export function naiveDateToUtcIso(date: Date, timezone: string): string {
    const naive = format(date, "yyyy-MM-dd'T'HH:mm:ss");
    const parsed = parseOffset(timezone);
    if (parsed) {
        return new Date(`${naive}${timezone}`).toISOString();
    }
    return date.toISOString();
}

export function parseToDate(value: string | Date | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return undefined;
    }
    return d;
}
