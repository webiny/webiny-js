import React from "react";
import { getPlugins } from "@webiny/plugins";
import { Switch } from "@webiny/react-router";
import { RoutePlugin } from "@webiny/app/types";

export const Routes = () => {
    const plugins = getPlugins<RoutePlugin>("route").sort((a, b) => {
        const pathA = a.route.props.path || "*";
        const pathB = b.route.props.path || "*";

        if (pathA === "*" || pathA === "/") {
            return 1;
        }

        if (pathB === "*" || pathB === "/") {
            return -1;
        }

        return 0;
    });
    
    return <Switch>{plugins.map(pl => React.cloneElement(pl.route, { key: pl.name }))}</Switch>;
};
