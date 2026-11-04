import { getLenientToday, resolveDateExpression } from "@webiny/utils";

/**
 * The limit a `dateGte`/`dateLte` validator stands for: its fixed value, or its expression
 * worked out against "today". The server can't know the user's timezone, so a lower limit uses
 * the earliest date on Earth and an upper limit the latest: a date the user's own today allows
 * always passes. Throws when an expression can't be read.
 */
export function getDateLimit(
    settings: Record<string, any> | undefined,
    limit: "gte" | "lte"
): unknown {
    const { value, expression } = settings || {};
    if (typeof expression === "string") {
        return resolveDateExpression(expression, getLenientToday(limit));
    }
    return value;
}

/** Puts the limit into a message's `{date}`, as it is stored (`2008-10-19`). */
export function formatDateLimitMessage(
    message: string,
    settings: Record<string, any> | undefined,
    limit: "gte" | "lte"
): string {
    let date: unknown;
    try {
        date = getDateLimit(settings, limit);
    } catch {
        return message;
    }
    return date == null ? message : message.replace(/\{date}/g, String(date));
}
