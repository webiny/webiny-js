import { registerPlugins, getPlugins } from "@webiny/plugins";
import { AppTemplateHOC, AppTemplateHOCPlugin } from "./types";
import React from "react";
import { WebinyInitPlugin, Plugin } from "@webiny/app/types";

const compose = (...funcs: AppTemplateHOC[]) =>
    funcs.reduce(
        (a, b) => (...args) => a(b(...args)),
        arg => arg
    );

// TODO: replace with Routes component from `@webiny/app` package after merging
const Routes = () => {
    const plugins = getPlugins<any>("route");
    return <>{plugins.map(pl => React.cloneElement(pl.route, { key: pl.name, exact: true }))}</>;
};

export interface TemplateFactory<T> {
    (opts: T): any;
}

export function createTemplate<T>(factory: TemplateFactory<T>) {
    return (opts: T) => {
        const plugins = factory(opts);
        registerPlugins(plugins);

        getPlugins<WebinyInitPlugin>("webiny-init").forEach(plugin => plugin.init());

        const hocs = getPlugins<AppTemplateHOCPlugin>("app-template-hoc").map(pl => pl.hoc);
        return compose(...hocs)(Routes);
    };
}
