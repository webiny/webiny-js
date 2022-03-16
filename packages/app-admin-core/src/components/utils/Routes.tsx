import React from "react";
import { plugins } from "@webiny/plugins";
import { Routes as ReactRouterRoutes, RouteProps, useLocation } from "@webiny/react-router";
import { Route } from "react-router-dom";
import { RoutePlugin } from "@webiny/app/types";
import { Location } from "history";

interface RoutesProps {
    routes: JSX.Element[];
}

function createNativeRoute(props: RouteProps, index: number, location: Location) {
    const newProps = { ...props };
    if (!props.exact) {
        newProps.path = `${props.path}/*`;
    }
    delete newProps["exact"];

    if (typeof props.render === "function") {
        newProps.element = props.render({ location });
    } else if (props.component) {
        const Component = props.component;
        newProps.element = <Component />;
    }
    delete newProps["render"];
    delete newProps["component"];

    if (props.children) {
        newProps.element = props.children;
    }

    delete newProps["children"];

    return <Route key={`${newProps.path}:${index}`} {...newProps} />;
}

export const Routes: React.FC<RoutesProps> = props => {
    const location = useLocation();

    const routes = [
        ...props.routes,
        // For backwards compatibility, we need to support the RoutePlugin routes as well.
        ...plugins.byType<RoutePlugin>("route").map(({ route }) => route)
    ].sort((a, b) => {
        const pathA = a.props.path || "*";
        const pathB = b.props.path || "*";

        // This will sort paths at the very bottom of the list
        if (pathA === "/" && pathB === "*") {
            return -1;
        }

        // This will push * and / to the bottom of the list
        if (pathA === "*" || pathA === "/") {
            return 1;
        }

        // This will push * and / to the bottom of the list
        if (["*", "/"].includes(pathB)) {
            return -1;
        }

        return 0;
    });

    return (
        <ReactRouterRoutes>
            {routes.map((route, index) => createNativeRoute(route.props, index, location))}
        </ReactRouterRoutes>
    );
};
