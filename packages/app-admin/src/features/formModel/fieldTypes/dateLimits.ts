import { z } from "zod";
import { getLocalToday, resolveDateBound, type DateBound } from "@webiny/utils";

export type { DateBound };

export interface IDateLimit {
    bound: DateBound;
    message?: string;
}

/** A field's date limits, as `datetime()` hands them to its renderer in `rendererSettings`. */
export interface IDateLimits {
    gte: DateBound[];
    lte: DateBound[];
}

/** The resolved limits: the latest lower limit and the earliest upper one. */
export interface IResolvedDateLimits {
    min?: string;
    max?: string;
}

const describeBound = (bound: DateBound) =>
    typeof bound === "string" ? bound : `"${bound.expression}"`;

/**
 * A field's limits as dates, with expressions worked out against `today` (the editor's local
 * date by default). An expression that can't be read is left out.
 */
export function resolveDateLimits(
    limits: IDateLimits | undefined,
    today: string = getLocalToday()
): IResolvedDateLimits {
    const resolve = (bounds: DateBound[] = []) =>
        bounds.flatMap(bound => {
            try {
                return [resolveDateBound(bound, today)];
            } catch {
                return [];
            }
        });
    const gte = resolve(limits?.gte);
    const lte = resolve(limits?.lte);
    return {
        min: gte.length ? gte.reduce((a, b) => (a > b ? a : b)) : undefined,
        max: lte.length ? lte.reduce((a, b) => (a < b ? a : b)) : undefined
    };
}

/** Reads the limits `datetime()` put into a field's renderer settings. */
export function getDateLimits(rendererSettings: unknown): IDateLimits | undefined {
    if (!rendererSettings || typeof rendererSettings !== "object") {
        return undefined;
    }
    return (rendererSettings as { dateLimits?: IDateLimits }).dateLimits;
}

/** Shows a worked-out limit in a message; by default as it is stored (`2008-10-19`). */
export type DateLimitFormatter = (date: string) => string;

/** The message when a limit has none of its own. */
export const DEFAULT_DATE_GTE_MESSAGE = "Must be on or after {date}.";
export const DEFAULT_DATE_LTE_MESSAGE = "Must be on or before {date}.";

/** Puts the worked-out limit into a message's `{date}`. */
export function formatDateLimitMessage(message: string, date: string): string {
    return message.replace(/\{date}/g, date);
}

/**
 * A schema that checks a value, or each value of a list, against the limits. Expressions are
 * worked out against the editor's local date at the moment of the check, so a form left open
 * overnight checks against the new day. A message's `{date}` is the worked-out limit.
 */
export function createDateLimitsSchema(
    gte: IDateLimit[],
    lte: IDateLimit[],
    formatDate: DateLimitFormatter = date => date
): z.ZodTypeAny {
    return z.any().superRefine((value, ctx) => {
        const values = (Array.isArray(value) ? value : [value]).filter(
            v => v !== null && v !== undefined && v !== ""
        );
        if (values.length === 0) {
            return;
        }
        const today = getLocalToday();
        const check = (limit: IDateLimit, kind: "gte" | "lte") => {
            let date: string;
            try {
                date = resolveDateBound(limit.bound, today);
            } catch {
                ctx.addIssue({
                    code: "custom",
                    message: `Invalid date limit ${describeBound(limit.bound)}.`
                });
                return false;
            }
            const ok = values.every(v => (kind === "gte" ? String(v) >= date : String(v) <= date));
            if (!ok) {
                const message =
                    limit.message ||
                    (kind === "gte" ? DEFAULT_DATE_GTE_MESSAGE : DEFAULT_DATE_LTE_MESSAGE);
                ctx.addIssue({
                    code: "custom",
                    message: formatDateLimitMessage(message, formatDate(date))
                });
            }
            return ok;
        };
        for (const limit of gte) {
            if (!check(limit, "gte")) {
                return;
            }
        }
        for (const limit of lte) {
            if (!check(limit, "lte")) {
                return;
            }
        }
    });
}
