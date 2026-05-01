import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import { DEFAULT_YEAR_RANGE_SIZE, MONTH_NAMES_SHORT } from "./constants.js";

export function formatDateForDisplay(
    value:
        | Date
        | string
        | number
        | { from?: string; to?: string }
        | Date[]
        | string[]
        | number[]
        | undefined,
    type: string,
    displayFormat?: string
): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    switch (type) {
        case "date":
            return format(new Date(value as string), displayFormat ?? "PPP");
        case "time":
            return value as string;
        case "dateTimeLocal":
            return format(new Date(value as string), displayFormat ?? "PPP p");
        case "dateTimeTz": {
            if (!value) {
                return undefined;
            }
            const isoStr = value as string;
            const tzMatch = isoStr.match(/([+-]\d{2}:\d{2})$/);
            const tz = tzMatch ? `UTC${tzMatch[1]}` : "";
            const dateWithoutTz = isoStr.replace(/[+-]\d{2}:\d{2}$/, "");
            const parts = dateWithoutTz.split("T");
            if (parts.length < 2) {
                return isoStr;
            }
            const datePart = new Date(parts[0] + "T00:00:00");
            const timeParts = parts[1].split(":");
            const hours = Number(timeParts[0]);
            const minutes = timeParts[1] ?? "00";
            const ampm = hours >= 12 ? "PM" : "AM";
            const h12 = hours % 12 || 12;
            if (displayFormat) {
                return `${format(datePart, displayFormat)} ${h12}:${minutes} ${ampm} (${tz})`;
            }
            return `${format(datePart, "PPP")} ${h12}:${minutes} ${ampm} (${tz})`;
        }
        case "month": {
            if (displayFormat) {
                const parsed = parseMonthValue(value as string);
                if (!parsed) {
                    return undefined;
                }
                return format(new Date(parsed.year, parsed.month), displayFormat);
            }
            const parsed = parseMonthValue(value as string);
            if (!parsed) {
                return undefined;
            }
            return `${MONTH_NAMES_SHORT[parsed.month]} ${parsed.year}`;
        }
        case "week": {
            const parsed = parseWeekValue(value as string);
            if (!parsed) {
                return undefined;
            }
            const weekStart = startOfISOWeek(new Date(parsed.year, 0, 4 + (parsed.week - 1) * 7));
            const weekEnd = endOfISOWeek(weekStart);
            if (displayFormat) {
                return `${format(weekStart, displayFormat)} – ${format(weekEnd, displayFormat)}`;
            }
            return `Week ${parsed.week}, ${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
        }
        case "year":
            return String(value);
        case "dateRange": {
            const range = value as { from?: string; to?: string };
            const fmt = displayFormat ?? "PPP";
            if (!range.from) {
                return undefined;
            }
            if (!range.to) {
                return format(new Date(range.from), fmt);
            }
            return `${format(new Date(range.from), fmt)} – ${format(new Date(range.to), fmt)}`;
        }
        case "multipleDates": {
            const dates = value as string[];
            if (dates.length === 0) {
                return undefined;
            }
            return `${dates.length} date${dates.length > 1 ? "s" : ""} selected`;
        }
        case "multipleMonths": {
            const months = value as string[];
            if (months.length === 0) {
                return undefined;
            }
            return `${months.length} month${months.length > 1 ? "s" : ""} selected`;
        }
        case "multipleYears": {
            const years = value as number[];
            if (years.length === 0) {
                return undefined;
            }
            return `${years.length} year${years.length > 1 ? "s" : ""} selected`;
        }
        default:
            return undefined;
    }
}

export function defaultYearRange(centerYear?: number): [number, number] {
    const center = centerYear ?? new Date().getFullYear();
    const half = Math.floor(DEFAULT_YEAR_RANGE_SIZE / 2);
    return [center - half, center + half - 1];
}

export function formatMonthValue(year: number, month: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function parseMonthValue(value: string): { year: number; month: number } | undefined {
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        return undefined;
    }
    return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

export function formatTimeValue(date: Date): string {
    return format(date, "HH:mm");
}

export function parseTimeValue(time: string): { hours: number; minutes: number } | undefined {
    const match = time.match(/^(\d{2}):(\d{2})$/);
    if (!match) {
        return undefined;
    }
    return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function toIsoWithTz(date: Date, timezone?: string): string {
    if (timezone) {
        return format(date, "yyyy-MM-dd'T'HH:mm:ss") + timezone;
    }
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const minutes = String(absOffset % 60).padStart(2, "0");
    return format(date, "yyyy-MM-dd'T'HH:mm:ss") + `${sign}${hours}:${minutes}`;
}

export function getLocalTimezone(): string {
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const minutes = String(absOffset % 60).padStart(2, "0");
    return `${sign}${hours}:${minutes}`;
}

export function extractTimezone(isoString: string): string | undefined {
    const match = isoString.match(/([+-]\d{2}:\d{2})$/);
    if (match) {
        return match[1];
    }
    return undefined;
}

export function toLocalNaive(isoString: string): Date {
    return new Date(isoString);
}

export function formatWeekValue(date: Date): string {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `${year}-W${String(week).padStart(2, "0")}`;
}

export function parseWeekValue(value: string): { year: number; week: number } | undefined {
    const match = value.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
        return undefined;
    }
    return { year: Number(match[1]), week: Number(match[2]) };
}
