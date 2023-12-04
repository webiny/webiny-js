import UniversalRouter, {
    RouterContext,
    RouteParams as UniversalRouteParams
} from "universal-router";
import generateUrls from "universal-router/generateUrls";
import {
    MatchedRoute,
    RouterGateway,
    RouteParams,
    RouteDefinition
} from "~/Router/RouterGateway.interface";

interface RouteDefinitionWithAction extends RouteDefinition {
    action(context: RouterContext, params: UniversalRouteParams): MatchedRoute;
}

export class UniversalRouterGateway implements RouterGateway {
    private readonly routes: RouteDefinitionWithAction[] = [];
    private readonly router: UniversalRouter;
    private readonly urlGenerator: ReturnType<typeof generateUrls>;

    constructor(baseUrl: string) {
        this.router = new UniversalRouter(this.routes, {
            baseUrl,
            resolveRoute(context, params) {
                if (!context.path) {
                    return context.next();
                }

                if (!context.route.action) {
                    return undefined;
                }

                return context.route.action(context, params);
            },
            errorHandler(_error, _context) {
                return undefined;
            }
        });

        this.urlGenerator = generateUrls(this.router, {
            stringifyQueryParams: params => {
                return new URLSearchParams(params as Record<string, any>).toString();
            }
        });
    }

    matchRoute(location: string): Promise<MatchedRoute | undefined> {
        return this.router.resolve(location);
    }

    generateRouteUrl(id: string, params?: RouteParams): string {
        return this.urlGenerator(id, params);
    }

    registerRoutes(routes: RouteDefinition[]): void {
        routes.forEach(route => {
            this.routes.push({
                ...route,
                action(context, params) {
                    return {
                        path: route.path,
                        pathname: context.pathname,
                        params
                    };
                }
            });
        });
    }
}
