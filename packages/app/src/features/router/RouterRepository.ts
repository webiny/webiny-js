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
import { createImplementation } from "@webiny/di";
import { RouteUrl } from "./RouteUrl.js";

const INIT_ROUTE = { name: "__init__", path: "", pathname: "", params: {} };

class RouterRepositoryImpl implements Abstractions.RouterRepository.Interface {
    private gateway: Abstractions.RouterGateway.Interface;
    private currentRoute: MatchedRoute = INIT_ROUTE;
    private routes: Route<any>[] = [];
    private guards = new Set<RouteTransitionGuardConfig>();
    private pendingTransition: TransitionController | undefined;
    private forceUnblocked = false;

    constructor(gateway: Abstractions.RouterGateway.Interface) {
        this.gateway = gateway;
        this.installBlocker();

        makeAutoObservable(this, {
            guards: false,
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

    addGuard(config: RouteTransitionGuardConfig): GuardDisposer {
        this.guards.add(config);
        return () => {
            this.guards.delete(config);
        };
    }

    isBlocked(): boolean {
        return this.findBlockingGuard() !== undefined;
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

    private installBlocker(): void {
        this.gateway.onRouteExit(controller => {
            if (this.forceUnblocked) {
                this.forceUnblocked = false;
                controller.continue();
                return;
            }

            const blockingGuard = this.findBlockingGuard();
            if (blockingGuard) {
                this.pendingTransition = controller;
                blockingGuard.onBlocked();
            } else {
                controller.continue();
            }
        });
    }

    private findBlockingGuard(): RouteTransitionGuardConfig | undefined {
        for (const config of this.guards) {
            if (config.guard()) {
                return config;
            }
        }
        return undefined;
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
            Object.assign(this.currentRoute, {
                ...matchedRoute,
                params
            });
        });
    }

    private getRouteByName(name: string) {
        return this.routes.find(existingRoute => existingRoute.name === name);
    }
}

export const RouterRepository = createImplementation({
    implementation: RouterRepositoryImpl,
    abstraction: Abstractions.RouterRepository,
    dependencies: [Abstractions.RouterGateway]
});
