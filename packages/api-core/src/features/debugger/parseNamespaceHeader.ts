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
     * Duplicate headers arrive comma-joined from both Node and API Gateway. The array form is
     * accepted anyway, so a transport that keeps repeated headers apart cannot break parsing.
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
