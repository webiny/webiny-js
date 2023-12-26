import React, { useContext, useEffect, useMemo } from "react";
import type { History } from "history";
import { observer } from "mobx-react-lite";
import { HistoryRouterGateway } from "~/Router/HistoryRouterGateway";
import { RouterRepository } from "./Router/RouterRepository";
import { RouterPresenter } from "./Router/RouterPresenter";
import { MatchedRoute } from "~/Router/abstractions/IRouterGateway";

interface RouterProps {
    // TODO: change this. input should NOT be an element.
    routes: JSX.Element[];
    getBaseUrl: () => string;
    history: History;
    children: JSX.Element;
}

interface MatchedRouteWithElement extends MatchedRoute {
    element: JSX.Element;
}

const RouteContext = React.createContext<MatchedRouteWithElement | undefined>(undefined);

export const Router = observer(({ getBaseUrl, routes, history, children }: RouterProps) => {
    const gateway = new HistoryRouterGateway(history, getBaseUrl());
    const repository = new RouterRepository(gateway);
    const presenter = useMemo(() => new RouterPresenter(repository), [repository]);

    return (
        <RouterInner presenter={presenter} routes={routes}>
            {children}
        </RouterInner>
    );
});

interface RouterInnerProps {
    presenter: RouterPresenter;
    routes: JSX.Element[];
    children: JSX.Element;
}

export const RouterInner = ({ presenter, routes, children }: RouterInnerProps) => {
    useEffect(() => {
        const routeDefs = routes.map(route => ({ name: route.props.name, path: route.props.path }));
        presenter.bootstrap(routeDefs);
    }, [routes.length]);

    const currentRoute = presenter.vm;

    if (!currentRoute) {
        return null;
    }

    const route = routes.find(route => route.props.name === currentRoute.name);
    if (!route) {
        return null;
    }

    return (
        <RouteContext.Provider value={{ ...currentRoute, element: route.props.element }}>
            {children}
        </RouteContext.Provider>
    );
};

export const RouteContent = () => {
    const route = useContext(RouteContext);

    if (!route) {
        return null;
    }

    return <>{route.element}</>;
};
