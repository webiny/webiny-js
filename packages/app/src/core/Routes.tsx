import React from "react";
import { plugins } from "@webiny/plugins";
import { Routes as ReactRouterRoutes } from "@webiny/react-router";
import { RoutePlugin } from "~/types";

interface RoutesProps {
    routes: JSX.Element[];
}

export const Routes = (props: RoutesProps) => {
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
            {routes.map((route, index) =>
                React.cloneElement(route, { key: `${route.props.path}:${index}` })
            )}
        </ReactRouterRoutes>
    );
};
