import type { TDate } from "./types.js";

export function toISOString(date: TDate): string {
    if (date instanceof Date) {
        return date.toISOString();
    }
    if (typeof date === "number") {
        return new Date(date).toISOString();
    }
    return date;
}
