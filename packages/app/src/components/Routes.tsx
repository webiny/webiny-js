import React from "react";
import { plugins } from "@webiny/plugins";
import { Routes as ReactRouterRoutes } from "@webiny/react-router";
import { RoutePlugin } from "../types";

export const Routes = () => {
    // We cannot call `sort` on the array returned by the `plugins.byType` call - it is read-only.
    const routes = [...plugins.byType<RoutePlugin>("route")].sort((a, b) => {
        const pathA = a.route.props.path || "*";
        const pathB = b.route.props.path || "*";

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
            {routes.map(({ route, name }) => React.cloneElement(route, { key: name }))}
        </ReactRouterRoutes>
    );
};
