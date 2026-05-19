import type { TDate } from "./types.js";

export function toEpochMs(date: TDate): number {
    if (date instanceof Date) {
        return date.getTime();
    }
    if (typeof date === "number") {
        return date;
    }
    return new Date(date).getTime();
}
