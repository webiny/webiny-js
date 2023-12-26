import { MatchedRoute, RouteParams } from "~/Router/abstractions/IRouterGateway";

export { RouteParams };

export interface RouteDefinition {
    name: string;
    path: string;
}

export interface IRouterRepository {
    getCurrentRoute(): MatchedRoute | undefined;
    getRouteByName(name: string): RouteDefinition | undefined;
    goToRoute(name: string, params?: RouteParams): void;
    registerRoutes(routes: RouteDefinition[]): void;
}
