export interface RouteParams {
    [key: string]: string | number | string[] | number[];
}

export interface RouteDefinition {
    name: string;
    path: string;
    onMatch(route: MatchedRoute): void;
}

export interface MatchedRoute {
    // Name of the matched route.
    name: string;
    // Pathname that was used to match the route.
    pathname: string;
    // Path pattern that matched this route.
    path: string;
    // Route params extracted from the pathname.
    params: Record<string, any>;
    // Query string params.
    queryParams: Record<string, any>;
}

export interface IRouterGateway {
    registerRoutes(routes: RouteDefinition[]): void;
    goToRoute(name: string, params: RouteParams): void;
    generateRouteUrl(id: string, params?: RouteParams): string;
}
