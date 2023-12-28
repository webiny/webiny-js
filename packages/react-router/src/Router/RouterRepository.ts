import { makeAutoObservable, runInAction } from "mobx";
import {
    MatchedRoute,
    RouteDefinition,
    RouteParams,
    IRouterGateway
} from "~/Router/abstractions/IRouterGateway";
import { IRouterRepository } from "~/Router/abstractions/IRouterRepository";

const INIT_ROUTE = { name: "__init__", path: "", pathname: "", params: {}, queryParams: {} };

export class RouterRepository implements IRouterRepository {
    private gateway: IRouterGateway;
    private currentRoute: MatchedRoute = INIT_ROUTE;
    private routes: RouteDefinition[] = [];

    constructor(gateway: IRouterGateway) {
        this.gateway = gateway;

        makeAutoObservable(this);
    }

    getCurrentRoute() {
        return this.currentRoute.name !== INIT_ROUTE.name ? this.currentRoute : undefined;
    }

    registerRoutes = (routes: RouteDefinition[]) => {
        this.routes = routes;
        const routesWithAction = routes.map<RouteDefinition>(route => {
            return {
                ...route,
                onMatch: this.transitionToRoute.bind(this)
            };
        });

        this.gateway.registerRoutes(routesWithAction);
    };

    getRouteByName(name: string): RouteDefinition | undefined {
        return this.routes.find(route => route.name === name);
    }

    goToRoute(name: string, params?: RouteParams): void {
        this.gateway.goToRoute(name, params ?? {});
    }

    private transitionToRoute(route: MatchedRoute) {
        runInAction(() => {
            Object.assign(this.currentRoute, route);
        });
    }
}
