import type { History } from "history";
import UniversalRouter, {
    RouterContext,
    RouteParams as UniversalRouteParams
} from "universal-router";
import generateUrls from "universal-router/generateUrls";
import {
    MatchedRoute,
    IRouterGateway,
    RouteParams,
    RouteDefinition
} from "~/Router/abstractions/IRouterGateway";

type RouteResolveResult = [MatchedRoute, RouteDefinition["onMatch"]];

interface RouteDefinitionWithAction extends RouteDefinition {
    action(context: RouterContext, params: UniversalRouteParams): RouteResolveResult;
}

export class HistoryRouterGateway implements IRouterGateway {
    private readonly history: History;
    private readonly routes: RouteDefinitionWithAction[] = [];
    private readonly router: UniversalRouter<RouteResolveResult>;
    private readonly urlGenerator: ReturnType<typeof generateUrls>;

    constructor(history: History, baseUrl: string) {
        this.history = history;

        this.router = new UniversalRouter<RouteResolveResult>(this.routes, {
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

        history.listen(async ({ location }) => {
            const result = await this.router.resolve(location.pathname);
            if (!result) {
                return;
            }

            const [matchedRoute, onMatch] = result;

            onMatch(matchedRoute);
        });
    }

    goToRoute(name: string, params: RouteParams): void {
        this.history.push(this.generateRouteUrl(name, params));
    }

    generateRouteUrl(id: string, params?: RouteParams): string {
        return this.urlGenerator(id, params);
    }

    async registerRoutes(routes: RouteDefinition[]): void {
        routes.forEach(route => {
            this.routes.push({
                ...route,
                action(context, params) {
                    const matchedRoute = {
                        name: route.name,
                        path: route.path,
                        pathname: context.pathname,
                        params
                    };

                    const onMatch = (matchedRoute: MatchedRoute) => route.onMatch(matchedRoute);

                    return [matchedRoute, onMatch];
                }
            });
        });

        this.sortRoutes(this.routes);

        console.log(this.routes);

        const result = await this.router.resolve(location.pathname);
        if (!result) {
            return;
        }

        const [matchedRoute, onMatch] = result;

        onMatch(matchedRoute);
    }

    private sortRoutes(routes: RouteDefinition[]) {
        const INDEX_PATH = "/";
        const MATCH_ALL = "(.*)";

        routes.sort((a, b) => {
            const pathA = a.path || MATCH_ALL;
            const pathB = b.path || MATCH_ALL;

            // This will sort paths at the very bottom of the list
            if (pathA === INDEX_PATH && pathB === MATCH_ALL) {
                return -1;
            }

            // This will push * and / to the bottom of the list
            if (pathA === MATCH_ALL || pathA === INDEX_PATH) {
                return 1;
            }

            // This will push * and / to the bottom of the list
            if ([MATCH_ALL, INDEX_PATH].includes(pathB)) {
                return -1;
            }

            return 0;
        });
    }
}
