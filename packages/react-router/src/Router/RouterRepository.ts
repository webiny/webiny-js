import { makeAutoObservable } from "mobx";
import {
    MatchedRoute,
    RouteDefinition,
    RouteParams,
    IRouterGateway
} from "~/Router/abstractions/IRouterGateway";
import { IRouterRepository } from "~/Router/abstractions/IRouterRepository";

export class RouterRepository implements IRouterRepository {
    private gateway: IRouterGateway;
    private currentRoute: MatchedRoute | undefined;
    private routes: RouteDefinition[] = [];

    constructor(gateway: IRouterGateway) {
        this.gateway = gateway;

        makeAutoObservable(this);
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    registerRoutes(routes: RouteDefinition[]) {
        this.routes = routes;
        const routesWithAction = routes.map<RouteDefinition>(route => {
            return {
                ...route,
                onMatch: (route: MatchedRoute) => {
                    this.currentRoute = route;
                }
            };
        });

        this.gateway.registerRoutes(routesWithAction);
    }

    getRouteByName(name: string): RouteDefinition | undefined {
        return this.routes.find(route => route.name === name);
    }

    goToRoute(name: string, params?: RouteParams): void {
        this.gateway.goToRoute(name, params ?? {});
    }
}
