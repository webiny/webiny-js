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
    private onRouteExitCb: OnRouteExit | undefined;

    constructor(history: History, baseUrl: string) {
        this.history = history;
        this.router = new Router(baseUrl);

        this.stopListening = history.listen(async ({ location }) => {
            const queryParams = Object.fromEntries(new URLSearchParams(location.search).entries());
            this.resolvePathname(location.pathname, queryParams);
        });
    }

    onRouteExit(cb: OnRouteExit): void {
        this.onRouteExitCb = cb;
        this.installBlocker();
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
        if (this.unblock) {
            this.unblock();
            this.unblock = undefined;
        }
        this.onRouteExitCb = undefined;
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

    private installBlocker(): void {
        if (this.unblock) {
            this.unblock();
        }

        this.unblock = this.history.block(tx => {
            const onRouteExit = this.onRouteExitCb;
            if (!onRouteExit) {
                this.removeBlockerAndRetry(tx);
                return;
            }

            let resolved = false;

            onRouteExit({
                continue: () => {
                    if (!resolved) {
                        resolved = true;
                        this.removeBlockerAndRetry(tx);
                    }
                },
                cancel: () => {
                    resolved = true;
                    // Do nothing — history v5 already reverted the URL.
                }
            });
        });
    }

    private removeBlockerAndRetry(tx: { retry: () => void }): void {
        // We must remove the blocker before retrying because history v5's
        // allowTx() always returns false when any blocker is registered.
        if (this.unblock) {
            this.unblock();
            this.unblock = undefined;
        }

        // Listen for the next navigation to complete, then reinstall the
        // blocker. This avoids the race condition where setTimeout-based
        // reinstallation fires before an async popstate (back/forward)
        // has settled, causing the blocker to catch its own retried
        // navigation in an infinite loop.
        const unlisten = this.history.listen(() => {
            unlisten();
            this.installBlocker();
        });

        tx.retry();
    }
}
