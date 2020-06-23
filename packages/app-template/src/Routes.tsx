import React from "react";
import { getPlugins } from "@webiny/plugins";
import { Switch } from "@webiny/react-router";
import { RoutePlugin } from "@webiny/app/types";

export const Routes = () => {
    const plugins = getPlugins<RoutePlugin>("route").sort((a, b) => {
        if (a.name === "route-not-found" || a.name === "route-root") {
            return 1;
        }

        if (b.name === "route-not-found" || b.name === "route-root") {
            return -1;
        }

        return 0;
    });

    return <Switch>{plugins.map(pl => React.cloneElement(pl.route, { key: pl.name }))}</Switch>;
};
