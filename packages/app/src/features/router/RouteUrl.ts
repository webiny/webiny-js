interface Params {
    [key: string]: any;
}

interface MatchResult {
    params: Record<string, string>;
}

/**
 * Utility class for route URL pattern matching and generation.
 * Handles simple route patterns with :param syntax (e.g., /cms/entries/:modelId).
 *
 * Public API uses static methods, which internally construct RouteUrl instances
 * to handle the logic through proper instance methods.
 */
export class RouteUrl {
    private static patternCache = new Map<string, { regex: RegExp; keys: string[] }>();

    private readonly pattern: string;
    private readonly params: Params | undefined;
    private readonly baseUrl: string;

    private constructor(pattern: string, params?: Params, baseUrl?: string) {
        this.pattern = pattern;
        this.params = params;
        this.baseUrl = this.normalizeBaseUrl(baseUrl);
    }

    /**
     * Generate a URL from a route pattern and parameters.
     * Path parameters are injected into the pattern, remaining parameters become query strings.
     *
     * @param pattern - Route pattern (e.g., '/security/api-keys/:id')
     * @param params - Parameters object (e.g., { id: 123, new: true })
     * @param baseUrl - Optional base URL to prepend (e.g., '/tenant123')
     * @returns Generated URL string
     *
     * @example
     * RouteUrl.fromPattern('/security/api-keys/:id', { id: 123, new: true })
     * // Returns: '/security/api-keys/123?new=true'
     *
     * @example
     * RouteUrl.fromPattern('/file-manager', {}, '/tenant123')
     * // Returns: '/tenant123/file-manager'
     */
    static fromPattern(pattern: string, params?: Params, baseUrl?: string): string {
        const routeUrl = new RouteUrl(pattern, params, baseUrl);
        return routeUrl.generate();
    }

    /**
     * Match a pathname against a route pattern and extract parameters.
     * If baseUrl is provided, it will be stripped from the pathname before matching.
     *
     * @param pathname - The pathname to match (e.g., '/tenant123/security/api-keys/123')
     * @param pattern - Route pattern (e.g., '/security/api-keys/:id')
     * @param baseUrl - Optional base URL to strip before matching (e.g., '/tenant123')
     * @returns Object with extracted params if matched, null otherwise
     *
     * @example
     * RouteUrl.match('/security/api-keys/123', '/security/api-keys/:id')
     * // Returns: { params: { id: '123' } }
     *
     * @example
     * RouteUrl.match('/tenant123/file-manager', '/file-manager', '/tenant123')
     * // Returns: { params: {} }
     */
    static match(pathname: string, pattern: string, baseUrl?: string): MatchResult | null {
        const routeUrl = new RouteUrl(pattern, undefined, baseUrl);
        return routeUrl.matchPathname(pathname);
    }

    /**
     * Generate a URL from the instance's pattern, params, and baseUrl.
     */
    private generate(): string {
        if (!this.params) {
            return this.baseUrl + this.pattern;
        }

        // Extract path parameter names from pattern
        const pathKeys = this.extractPathKeys();

        // Replace :param with actual values
        let url = this.replacePathParams();

        // Handle empty url
        if (!url || url === "") {
            url = "/";
        }

        // Prepend baseUrl
        url = this.baseUrl + url;

        // Add query parameters for keys not used in the path
        const queryString = this.buildQueryString(pathKeys);
        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    }

    /**
     * Match a pathname against the instance's pattern.
     */
    private matchPathname(pathname: string): MatchResult | null {
        // Strip baseUrl from pathname if provided
        if (this.baseUrl && pathname.startsWith(this.baseUrl)) {
            pathname = pathname.slice(this.baseUrl.length) || "/";
        } else if (this.baseUrl) {
            // pathname doesn't start with baseUrl, no match
            return null;
        }

        // Handle wildcard pattern
        if (this.pattern === "*" || this.pattern === "(.*)") {
            return { params: {} };
        }

        // Get or create cached pattern
        let compiled = RouteUrl.patternCache.get(this.pattern);
        if (!compiled) {
            compiled = this.compilePattern();
            RouteUrl.patternCache.set(this.pattern, compiled);
        }

        const match = pathname.match(compiled.regex);
        if (!match) {
            return null;
        }

        // Extract parameters from capture groups
        const params: Record<string, string> = {};
        compiled.keys.forEach((key, index) => {
            const value = match[index + 1];
            if (value !== undefined) {
                params[key] = decodeURIComponent(value);
            }
        });

        return { params };
    }

    /**
     * Extract path parameter names from the pattern.
     */
    private extractPathKeys(): Set<string> {
        const pathKeys = new Set<string>();
        const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = paramRegex.exec(this.pattern)) !== null) {
            pathKeys.add(match[1]);
        }
        return pathKeys;
    }

    /**
     * Replace :param placeholders with actual values from params.
     */
    private replacePathParams(): string {
        return this.pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
            const value = this.params![key];
            if (value === undefined || value === null) {
                return "";
            }
            return encodeURIComponent(String(value));
        });
    }

    /**
     * Build query string from params that are not path parameters.
     */
    private buildQueryString(pathKeys: Set<string>): string {
        const queryParams: Record<string, any> = {};

        for (const key in this.params) {
            if (!pathKeys.has(key)) {
                queryParams[key] = this.params[key];
            }
        }

        if (Object.keys(queryParams).length === 0) {
            return "";
        }

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

        return searchParams.toString();
    }

    /**
     * Normalize baseUrl by ensuring it starts with / and doesn't end with /
     */
    private normalizeBaseUrl(baseUrl?: string): string {
        if (!baseUrl || baseUrl === "/") {
            return "";
        }

        let normalized = baseUrl;

        // Ensure it starts with /
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }

        // Remove trailing /
        if (normalized.endsWith("/")) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    }

    /**
     * Compile the instance's pattern into a regex and extract parameter names.
     */
    private compilePattern(): { regex: RegExp; keys: string[] } {
        const keys: string[] = [];

        // Escape special regex characters except for :param syntax
        let regexPattern = this.pattern
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special chars
            .replace(/\\\*/g, ".*"); // Handle * wildcard (already escaped by above)

        // Replace :param with capture groups
        regexPattern = regexPattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
            keys.push(key);
            return "([^/]+)"; // Match any non-slash characters
        });

        // Create regex that matches the entire pathname
        const regex = new RegExp(`^${regexPattern}$`);

        return { regex, keys };
    }
}
