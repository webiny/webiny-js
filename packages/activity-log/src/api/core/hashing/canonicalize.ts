/**
 * Deterministic serialisation, so that two values that mean the same thing produce the same
 * string on every runtime, in every field order, forever.
 *
 * Four normalisations, all of them chosen because the CMS produces both spellings of the same
 * value depending on which path a write took:
 *
 *   - `undefined`, `null` and `""` collapse to one token. A cleared text field arrives as `""`
 *     from the admin form and as `null` from a GraphQL write, and is simply absent after a
 *     shallow merge — none of those is a content change.
 *   - Object keys are sorted, since key order carries no meaning and is not stable across
 *     storage transforms.
 *   - Object keys whose value is absent-equivalent are dropped, so `{ a: "" }` and `{}` agree.
 *   - Numbers use one canonical spelling, so `1`, `1.0` and `-0` do not disagree.
 *
 * Values are type-tagged, so the string `"1"` and the number `1` never collide.
 */

const NULL_TOKEN = "~";

const canonicalNumber = (value: number): string => {
    if (!Number.isFinite(value)) {
        // NaN and +/-Infinity have no canonical JSON spelling and cannot survive a round trip
        // through storage, so they are treated as absent rather than given a representation.
        return NULL_TOKEN;
    }
    // Normalises -0 to 0. Number#toString is shortest-round-trip and so already deterministic.
    return `n${value === 0 ? 0 : value}`;
};

export const canonicalize = (value: unknown): string => {
    if (value === undefined || value === null || value === "") {
        return NULL_TOKEN;
    }

    if (typeof value === "boolean") {
        return value ? "b1" : "b0";
    }

    if (typeof value === "number") {
        return canonicalNumber(value);
    }

    if (typeof value === "bigint") {
        return `n${value}`;
    }

    if (typeof value === "string") {
        return `s${JSON.stringify(value)}`;
    }

    if (value instanceof Date) {
        const time = value.getTime();
        return Number.isNaN(time) ? NULL_TOKEN : `d${value.toISOString()}`;
    }

    if (Array.isArray(value)) {
        // Order is meaningful in a list, so it is preserved. Absent-equivalent items are kept,
        // because removing one would shift every following index.
        return `a[${value.map(canonicalize).join(",")}]`;
    }

    if (typeof value === "object") {
        const entries: string[] = [];

        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            const canonical = canonicalize((value as Record<string, unknown>)[key]);
            if (canonical === NULL_TOKEN) {
                continue;
            }
            entries.push(`${JSON.stringify(key)}:${canonical}`);
        }

        return `o{${entries.join(",")}}`;
    }

    // Functions and symbols cannot appear in entry values; treat them as absent rather than
    // letting them serialise to something unstable.
    return NULL_TOKEN;
};
