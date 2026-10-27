import type { RouteDefinition, MatchedRoute } from "./abstractions.js";
import { RouteUrl } from "./RouteUrl.js";

interface ResolveResult {
    matchedRoute: MatchedRoute;
    onMatch: (route: MatchedRoute) => void;
}

/**
 * Router manages a collection of route definitions and resolves pathnames to matched routes.
 */
export class Router {
    private routes: RouteDefinition[] = [];
    private baseUrl: string;

    constructor(baseUrl: string = "") {
        this.baseUrl = baseUrl;
    }

    /**
     * Replace the route definitions with `routes`, the complete current set.
     *
     * A route that is not in `routes` is dropped. Merging instead would keep routes that the config
     * no longer registers, for example one behind `HasPermission` after the user changes, and the
     * current URL would keep matching it.
     *
     * Names stay unique: a later definition with the same name replaces the earlier one in its
     * position, which is how a route from the config overrides a built-in one.
     *
     * @param routes - All route definitions.
     */
    setRoutes(routes: RouteDefinition[]): void {
        const byName = new Map<string, RouteDefinition>();
        for (const route of routes) {
            byName.set(route.name, route);
        }

        const uniqueRoutes = byName.values();
        this.routes = Array.from(uniqueRoutes);

        this.sortRoutes();
    }

    /**
     * Find a route by name.
     *
     * @param name - Route name to find
     * @returns Route definition if found, undefined otherwise
     */
    findRoute(name: string): RouteDefinition | undefined {
        return this.routes.find(r => r.name === name);
    }

    /**
     * Resolve a pathname to a matched route.
     * The pathname will be matched against patterns after stripping the baseUrl.
     *
     * @param pathname - The pathname to resolve (e.g., '/tenant123/cms/entries/123')
     * @param queryParams - Optional query parameters to merge into route params
     * @returns Matched route with onMatch callback, or null if no route matches
     */
    resolve(pathname: string, queryParams?: Record<string, unknown>): ResolveResult | null {
        for (const route of this.routes) {
            const pattern = route.path === "*" ? "(.*)" : route.path;
            const matchResult = RouteUrl.match(pathname, pattern, this.baseUrl);

            if (matchResult) {
                const matchedRoute: MatchedRoute = {
                    name: route.name,
                    path: route.path,
                    pathname,
                    params: { ...matchResult.params, ...(queryParams || {}) }
                };

                const onMatch = (matched: MatchedRoute) => {
                    route.onMatch(matched);
                };

                return { matchedRoute, onMatch };
            }
        }

        return null;
    }

    /**
     * Get the current baseUrl.
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }

    /**
     * Sort routes to ensure proper matching order.
     * Wildcard routes (*) and index routes (/) are moved to the bottom.
     */
    private sortRoutes(): void {
        const INDEX_PATH = "/";
        const WILDCARD_PATTERNS = ["*", "(.*)"];

        this.routes.sort((a, b) => {
            const pathA = a.path || "*";
            const pathB = b.path || "*";

            const isWildcardA = WILDCARD_PATTERNS.includes(pathA);
            const isWildcardB = WILDCARD_PATTERNS.includes(pathB);
            const isIndexA = pathA === INDEX_PATH;
            const isIndexB = pathB === INDEX_PATH;

            // Both are wildcards or both are index - maintain order
            if ((isWildcardA && isWildcardB) || (isIndexA && isIndexB)) {
                return 0;
            }

            // Index path should come before wildcard
            if (isIndexA && isWildcardB) {
                return -1;
            }
            if (isWildcardA && isIndexB) {
                return 1;
            }

            // Push wildcards to the bottom
            if (isWildcardA) {
                return 1;
            }
            if (isWildcardB) {
                return -1;
            }

            // Push index to the bottom (but above wildcards)
            if (isIndexA) {
                return 1;
            }
            if (isIndexB) {
                return -1;
            }

            // All other routes maintain their order
            return 0;
        });
    }
}
