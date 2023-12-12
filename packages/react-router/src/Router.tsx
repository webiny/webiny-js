import React, { useCallback, useEffect, useRef, useState } from "react";
import type { History } from "history";
import UniversalRouter, { RouterContext, RouteParams } from "universal-router";
import { useTenancy } from "@webiny/app-tenancy";
import { BrowserRouter } from "@webiny/react-router";
import { UniversalRouterGateway } from "~/Router/UniversalRouterGateway";
import { RouterRepository } from "~/Router/RouterRepository";

const getBasename = (tenant: string | null) => {
    if (tenant === "root") {
        return "";
    }

    return tenant ? `/t_${tenant}` : "";
};

interface RouterProps {
    // TODO: change this. input should NOT be an element.
    routes: JSX.Element[];
    getBaseUrl: () => string;
    history: History;
    children: React.ReactElement;
}

interface RouterInnerProps {
    presenter: RouterPresenter;
}

const RouterInner = ({ presenter }: RouterInnerProps) => {
    useEffect(() => {
        return history.listen(({ location }) => {
            presenter.current.current?.resolve(location.pathname).then(handleMatchedRoute);
        });
    }, []);

    return presenter.currentRoute ? <RouteRenderer route={presenter.currentRoute}></RouteRenderer>
};

export const Router = ({ getBaseUrl, routes, history, children }: RouterProps) => {
    const gateway = new UniversalRouterGateway(getBaseUrl());
    const repository = new RouterRepository(gateway);
    const presenter = useRef(new RouterPresenter(repository));

    useEffect(() => {
        presenter.bootstrap(routes);
    }, [routes.length]);

    useEffect(() => {
        return history.listen(({ location }) => {
            presenter.matchRoute(location.pathname);
        });
    }, []);

    return <RouterInner presenter={presenter.current} />;
};

const INDEX_PATH = "/";
const MATCH_ALL = "(.*)";

const sortByPath = (a: RouteDefinition, b: RouteDefinition) => {
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
};

const createRouteResolver =
    (history: History) =>
    ({ props }: JSX.Element): RouteDefinition => {
        return {
            path: props.path === "*" ? "(.*)" : props.path,
            action(context, params) {
                const element = props.render
                    ? props.render({ location: history.location })
                    : props.children;

                return {
                    path: context.route.path,
                    pathname: context.pathname,
                    element,
                    params,
                    queryParams: Object.fromEntries(new URLSearchParams(location.search))
                };
            }
        };
    };

interface RouteDefinition {
    path: string;
    action(context: RouterContext, params: RouteParams): ActiveRoute;
}

interface ActiveRoute {
    // Pathname that was used to match the route.
    pathname: string;
    // React element to render.
    element: React.ReactNode;
    // Path pattern that matched this route.
    path: string;
    // Route params extracted from the pathname.
    params: Record<string, any>;
    // Search query params.
    queryParams: Record<string, any>;
}

export const RouteContent = ({ history }: { history: History }) => {
    const { tenant } = useTenancy();
    const routerRef = useRef<UniversalRouter | undefined>(undefined);
    const [currentRoute, setCurrentRoute] = useState<ActiveRoute | null>(null);

    // For backwards compatibility, we need to support the RoutePlugin routes as well.

    const handleMatchedRoute = useCallback((route: ActiveRoute) => {
        if (!route.element) {
            return;
        }

        if (route) {
            setCurrentRoute(() => route);
        }
    }, []);

    useEffect(() => {
        const routeResolver = createRouteResolver(history);
        const routes = allRoutes.map<RouteDefinition>(routeResolver).sort(sortByPath);

        routerRef.current = new UniversalRouter(routes, {
            baseUrl: getBasename(String(tenant)),
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
                console.log(_error);
                return undefined;
            }
        });

        routerRef.current.resolve(history.location.pathname).then(handleMatchedRoute);
    }, [tenant, app.routes.length]);

    useEffect(() => {
        return history.listen(({ location }) => {
            routerRef.current?.resolve(location.pathname).then(handleMatchedRoute);
        });
    }, []);

    return currentRoute ? <>{currentRoute.element}</> : <span>No route was matched so far!</span>;
};
