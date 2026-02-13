import type { z } from "zod";
import type { History } from "history";
import type { RouteDefinition, OnRouteExit } from "./abstractions.js";
import { RouterGateway } from "./abstractions.js";
import { RouteUrl } from "./RouteUrl.js";
import { Router } from "./Router.js";

export class HistoryRouterGateway implements RouterGateway.Interface {
    private readonly history: History;
    private readonly router: Router;
    private stopListening: () => void;
    private unblock: (() => void) | undefined;

    constructor(history: History, baseUrl: string) {
        this.history = history;
        this.router = new Router(baseUrl);

        this.stopListening = history.listen(async ({ location }) => {
            const queryParams = Object.fromEntries(new URLSearchParams(location.search).entries());
            this.resolvePathname(location.pathname, queryParams);
        });
    }

    onRouteExit(cb: OnRouteExit): void {
        this.guardRouteExit(cb);
    }

    goToRoute(name: string, params: z.ZodTypeAny): void {
        const route = this.router.findRoute(name);
        if (!route) {
            console.warn(`Route "${name}" not found.`);
            return;
        }

        const baseUrl = this.router.getBaseUrl();
        this.history.push(RouteUrl.fromPattern(route.path, params, baseUrl));
    }

    setRoutes(routes: RouteDefinition[]) {
        this.router.setRoutes(routes);

        const queryParams = Object.fromEntries(
            new URLSearchParams(this.history.location.search).entries()
        );
        const currentPathname = this.history.location.pathname;
        this.resolvePathname(currentPathname, queryParams);
    }

    destroy(): void {
        this.stopListening();
        this.unblock && this.unblock();
    }

    pushState(url: string): void {
        this.history.push(url);
    }

    private async resolvePathname(pathname: string, queryParams?: Record<string, unknown>) {
        const result = this.router.resolve(pathname, queryParams);
        if (!result) {
            return;
        }

        const { matchedRoute, onMatch } = result;

        onMatch(matchedRoute);
    }

    private guardRouteExit(onRouteExit: OnRouteExit): void {
        if (this.unblock) {
            // Remove existing blocker before installing a new one.
            this.unblock();
        }

        this.unblock = this.history.block(tx => {
            let resolved = false;

            onRouteExit({
                continue: () => {
                    if (!resolved) {
                        resolved = true;
                        // We need to unblock the transition before retying.
                        if (this.unblock) {
                            this.unblock();
                            this.unblock = undefined;
                        }
                        // Perform transition.
                        tx.retry();
                    }
                },
                cancel: () => {
                    resolved = true;
                    // Do nothing.
                }
            });

            // Block the transition until `continue` is called.
            return false;
        });
    }
}
