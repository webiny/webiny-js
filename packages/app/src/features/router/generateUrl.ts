import { parse, tokensToFunction } from "path-to-regexp";

interface Params {
    [key: string]: any;
}

/**
 * Generate a URL from a route pattern and parameters.
 * Path parameters are injected into the pattern, remaining parameters become query strings.
 *
 * @param pattern - Route pattern (e.g., '/security/api-keys/:id')
 * @param params - Parameters object (e.g., { id: 123, new: true })
 * @param options - Optional configuration
 * @returns Generated URL string
 *
 * @example
 * generateUrl('/security/api-keys/:id', { id: 123, new: true })
 * // Returns: '/security/api-keys/123?new=true'
 */
export function generateUrl(pattern: string, params?: Params): string {
    // Parse the pattern to extract tokens
    const tokens = parse(pattern, {});
    const toPath = tokensToFunction(tokens);

    // Extract which keys are used in the path
    const pathKeys = Object.create(null);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token && typeof token !== "string") {
            pathKeys[token.name] = true;
        }
    }

    // Generate the base path with parameters
    let url = toPath(params) || "/";

    // Add query parameters for keys not used in the path
    if (params) {
        const queryParams: Record<string, any> = {};
        const keys = Object.keys(params);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key && !pathKeys[key]) {
                queryParams[key] = params[key] ?? "";
            }
        }

        // Stringify query parameters using URLSearchParams
        if (Object.keys(queryParams).length > 0) {
            const searchParams = new URLSearchParams();

            for (const key in queryParams) {
                const value = queryParams[key];
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(key, String(v)));
                    } else {
                        searchParams.append(key, String(value));
                    }
                }
            }

            const query = searchParams.toString();
            if (query) {
                url += `?${query}`;
            }
        }
    }

    return url;
}
