import { minimatch } from "minimatch";

export interface INamespaceFilter {
    matches(namespace: string): boolean;
}

/**
 * Builds a namespace matcher from the patterns requested by the client.
 *
 * A namespace matches when at least one positive pattern matches it and no negative pattern does.
 *
 * `minimatch` has its own native `!` negation which *inverts* the result rather than reporting a
 * match, so `!cms.os.*` would return `true` for every namespace that does not match it. Patterns are
 * therefore split into positive and negative lists here and matched positively, with `nonegate` set
 * as a second guard.
 */
export const createNamespaceFilter = (patterns: string[]): INamespaceFilter => {
    const positive: string[] = [];
    const negative: string[] = [];

    for (const pattern of patterns) {
        if (pattern.startsWith("!")) {
            const stripped = pattern.slice(1);
            if (stripped) {
                negative.push(stripped);
            }
            continue;
        }
        if (pattern) {
            positive.push(pattern);
        }
    }

    /**
     * Matching is stable for the life of a session, so each distinct namespace is matched once.
     */
    const cache = new Map<string, boolean>();

    const test = (namespace: string): boolean => {
        const isIncluded = positive.some(pattern => {
            return minimatch(namespace, pattern, { nonegate: true });
        });

        if (!isIncluded) {
            return false;
        }

        return !negative.some(pattern => {
            return minimatch(namespace, pattern, { nonegate: true });
        });
    };

    return {
        matches(namespace) {
            const cached = cache.get(namespace);
            if (cached !== undefined) {
                return cached;
            }
            const result = test(namespace);
            cache.set(namespace, result);
            return result;
        }
    };
};

/**
 * Parses the `x-webiny-debug` header into a namespace pattern list.
 *
 * Returns an empty array when capture was not requested. Never throws - a malformed header must not
 * be able to fail the request it arrived on.
 */
export const parseNamespaceHeader = (value: string | string[] | undefined): string[] => {
    if (!value) {
        return [];
    }

    /**
     * Duplicate headers arrive comma-joined from both Node and API Gateway; the array form only
     * shows up under `app.inject`.
     */
    const raw = Array.isArray(value) ? value.join(",") : value;

    const patterns = raw
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

    if (patterns.length === 0) {
        return [];
    }

    /**
     * `1` and `true` are shorthand for "everything". Anything else is treated as a pattern list.
     */
    if (patterns.length === 1) {
        const only = patterns[0].toLowerCase();
        if (only === "1" || only === "true") {
            return ["*"];
        }
    }

    return patterns;
};
