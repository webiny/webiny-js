import React, { useCallback, useContext, useEffect, useMemo } from "react";
import type { History, Location } from "history";
import { observer } from "mobx-react-lite";
import { HistoryRouterGateway } from "~/Router/HistoryRouterGateway";
import { RouterRepository } from "./Router/RouterRepository";
import { RouterPresenter } from "./Router/RouterPresenter";
import { MatchedRoute } from "~/Router/abstractions/IRouterGateway";

/**
 * @deprecated Use proper JSX.Element instead!
 */
interface DeprecatedRenderFunction {
    (params: { location: Location }): JSX.Element;
}

export interface RouteDefinition {
    name: string;
    path: string;
    element: JSX.Element | DeprecatedRenderFunction;
}

interface RouterProps {
    routes: RouteDefinition[];
    getBaseUrl: () => string;
    history: History;
    children: JSX.Element;
}

interface MatchedRouteWithElement extends MatchedRoute {
    element: JSX.Element;
}

const RouteContext = React.createContext<MatchedRouteWithElement | undefined>(undefined);

export const Router = ({ getBaseUrl, routes, history, children }: RouterProps) => {
    const gateway = new HistoryRouterGateway(history, getBaseUrl());
    const repository = new RouterRepository(gateway);
    const presenter = useMemo(() => new RouterPresenter(repository), [repository]);

    const getElementFromRoute = useCallback(
        (route: RouteDefinition) => {
            // For backwards compatibility.
            if (typeof route.element === "function") {
                console.warn(
                    `Deprecated "element" property usage in route ${route.name} (${route.path}).`
                );
                return route.element({ location: history.location });
            }
            return route.element;
        },
        [history]
    );

    return (
        <RouterInner
            presenter={presenter}
            routes={routes}
            getElementFromRoute={getElementFromRoute}
        >
            {children}
        </RouterInner>
    );
};

interface RouterInnerProps {
    presenter: RouterPresenter;
    routes: RouteDefinition[];
    getElementFromRoute: (route: RouteDefinition) => JSX.Element;
    children: JSX.Element;
}

export const RouterInner = observer(
    ({ presenter, routes, getElementFromRoute, children }: RouterInnerProps) => {
        useEffect(() => {
            const routeDefs = routes.map(route => ({
                name: route.name,
                path: route.path
            }));

            presenter.bootstrap(routeDefs);
        }, [routes.length]);

        const { currentRoute } = presenter.vm;

        console.log("presenter", currentRoute);

        const route = currentRoute ? routes.find(route => route.name === currentRoute.name) : null;

        console.log("route", route);

        const context: MatchedRouteWithElement | undefined = useMemo(() => {
            return route && currentRoute
                ? { ...currentRoute, element: getElementFromRoute(route) }
                : undefined;
        }, [route, currentRoute]);

        return <RouteContext.Provider value={context}>{children}</RouteContext.Provider>;
    }
);

export const RouteContent = observer(() => {
    const route = useContext(RouteContext);

    console.log("RouteContent.route", route);

    if (!route) {
        return null;
    }

    return <>{route.element}</>;
});
