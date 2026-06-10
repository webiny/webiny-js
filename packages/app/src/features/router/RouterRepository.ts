import { makeAutoObservable, runInAction } from "mobx";
import type {
    MatchedRoute,
    RouteDefinition,
    RouteTransitionGuardConfig,
    GuardDisposer,
    TransitionController
} from "./abstractions.js";
import * as Abstractions from "./abstractions.js";
import { Route, RouteParamsDefinition, RouteParamsInfer } from "./Route.js";
import { RouteUrl } from "./RouteUrl.js";

const INIT_ROUTE = { name: "__init__", path: "", pathname: "", params: {} };

class RouterRepositoryImpl implements Abstractions.RouterRepository.Interface {
    private gateway: Abstractions.RouterGateway.Interface;
    private currentRoute: MatchedRoute = INIT_ROUTE;
    private routes: Route<any>[] = [];
    private pendingTransition: TransitionController | undefined;
    private forceUnblocked = false;
    private guardDisposers = new Map<RouteTransitionGuardConfig, GuardDisposer>();

    constructor(gateway: Abstractions.RouterGateway.Interface) {
        this.gateway = gateway;

        makeAutoObservable(this, {
            pendingTransition: false,
            forceUnblocked: false
        } as any);
    }

    getMatchedRoute() {
        return this.currentRoute.name !== INIT_ROUTE.name ? this.currentRoute : undefined;
    }

    getCurrentRoute(): Route<any> | undefined {
        return this.routes.find(route => route.name === this.currentRoute.name);
    }

    registerRoutes = (routes: Route[]) => {
        this.routes = routes;
        const routesWithAction = routes.map<RouteDefinition>(this.routeWithAction);

        this.gateway.setRoutes(routesWithAction);
    };

    getLink<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params?: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): string {
        return RouteUrl.fromPattern(route.path, params);
    }

    goToRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): void {
        this.gateway.goToRoute(route.name, params);
    }

    replaceRoute<TParams extends RouteParamsDefinition | undefined>(
        route: Route<TParams>,
        params: TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
    ): void {
        this.gateway.replaceRoute(route.name, params);
    }

    addGuard(config: RouteTransitionGuardConfig): GuardDisposer {
        const gatewayGuard: RouteTransitionGuardConfig = {
            guard: () => {
                if (this.forceUnblocked) {
                    this.forceUnblocked = false;
                    return false;
                }
                return config.guard();
            },
            onBlocked: (controller: TransitionController) => {
                this.pendingTransition = controller;
                config.onBlocked(controller);
            }
        };

        const disposeGatewayGuard = this.gateway.addGuard(gatewayGuard);

        const dispose = () => {
            this.guardDisposers.delete(config);
            disposeGatewayGuard();
        };

        this.guardDisposers.set(config, dispose);
        return dispose;
    }

    isBlocked(): boolean {
        return this.pendingTransition !== undefined;
    }

    unblock(): void {
        this.forceUnblocked = true;
        if (this.pendingTransition) {
            this.forceUnblocked = false;
            const tx = this.pendingTransition;
            this.pendingTransition = undefined;
            tx.continue();
        } else {
            // No pending transition — expire the flag after the current
            // call stack so it only covers synchronous navigations that
            // follow immediately (e.g. router.goToRoute on the next line).
            setTimeout(() => {
                this.forceUnblocked = false;
            }, 0);
        }
    }

    confirmTransition(): void {
        const tx = this.pendingTransition;
        this.pendingTransition = undefined;
        if (tx) {
            tx.continue();
        }
    }

    cancelTransition(): void {
        if (this.pendingTransition) {
            this.pendingTransition.cancel();
            this.pendingTransition = undefined;
        }
    }

    destroy() {
        this.gateway.destroy();
    }

    private routeWithAction = (route: Route<any>) => {
        return {
            name: route.name,
            path: route.path,
            onMatch: this.transitionToRoute.bind(this)
        };
    };

    private async transitionToRoute(matchedRoute: MatchedRoute) {
        const route = this.getRouteByName(matchedRoute.name);
        if (!route) {
            return;
        }

        const params =
            typeof route.params?.parse === "function"
                ? route.params.parse(matchedRoute.params)
                : matchedRoute.params;

        runInAction(() => {
            this.currentRoute = { ...matchedRoute, params };
        });
    }

    private getRouteByName(name: string) {
        return this.routes.find(existingRoute => existingRoute.name === name);
    }
}

export const RouterRepository = Abstractions.RouterRepository.createImplementation({
    implementation: RouterRepositoryImpl,
    dependencies: [Abstractions.RouterGateway]
});
