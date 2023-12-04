export interface RouteParams {
    [key: string]: string | number | string[] | number[];
}

export interface RouteDefinition {
    name?: string;
    path: string;
}

export interface MatchedRoute {
    // Pathname that was used to match the route.
    pathname: string;
    // Path pattern that matched this route.
    path: string;
    // Route params extracted from the pathname.
    params: Record<string, any>;
}

export interface RouterGateway {
    registerRoutes(routes: RouteDefinition[]): void;
    matchRoute(location: string): Promise<MatchedRoute | undefined>;
    generateRouteUrl(id: string, params?: RouteParams): string;
}
