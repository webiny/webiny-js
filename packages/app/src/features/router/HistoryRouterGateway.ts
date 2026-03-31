import type { z } from "zod";
import type { History } from "history";
import type { RouteDefinition, RouteTransitionGuardConfig, GuardDisposer } from "./abstractions.js";
import { RouterGateway } from "./abstractions.js";
import { RouteUrl } from "./RouteUrl.js";
import { Router } from "./Router.js";

export class HistoryRouterGateway implements RouterGateway.Interface {
    private readonly history: History;
    private readonly router: Router;
    private stopListening: () => void;
    private unblock: (() => void) | undefined;
    private guards = new Set<RouteTransitionGuardConfig>();

    constructor(history: History, baseUrl: string) {
        this.history = history;
        this.router = new Router(baseUrl);

        this.stopListening = history.listen(async ({ location }) => {
            const queryParams = Object.fromEntries(new URLSearchParams(location.search).entries());
            this.resolvePathname(location.pathname, queryParams);
        });
    }

    addGuard(config: RouteTransitionGuardConfig): GuardDisposer {
        const hadGuards = this.guards.size > 0;
        this.guards.add(config);
        if (!hadGuards) {
            this.installBlocker();
        }
        return () => {
            this.guards.delete(config);
            if (this.guards.size === 0) {
                this.removeBlocker();
            }
        };
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
        this.removeBlocker();
        this.guards.clear();
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

    private findBlockingGuard(): RouteTransitionGuardConfig | undefined {
        for (const config of this.guards) {
            if (config.guard()) {
                return config;
            }
        }
        return undefined;
    }

    private installBlocker(): void {
        if (this.unblock) {
            this.unblock();
        }

        this.unblock = this.history.block(tx => {
            const blockingGuard = this.findBlockingGuard();
            if (blockingGuard) {
                let resolved = false;

                blockingGuard.onBlocked({
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
            } else {
                this.removeBlockerAndRetry(tx);
            }
        });
    }

    private removeBlocker(): void {
        if (this.unblock) {
            this.unblock();
            this.unblock = undefined;
        }
    }

    private removeBlockerAndRetry(tx: { retry: () => void }): void {
        // We must remove the blocker before retrying because history v5's
        // allowTx() always returns false when any blocker is registered.
        this.removeBlocker();

        // Listen for the next navigation to complete, then reinstall the
        // blocker only if guards are still active.
        const unlisten = this.history.listen(() => {
            unlisten();
            if (this.guards.size > 0) {
                this.installBlocker();
            }
        });

        tx.retry();
    }
}
