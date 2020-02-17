import React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { AppTemplateRenderer, AppTemplateRendererPlugin } from "./types";
import { WebinyInitPlugin } from "@webiny/app/types";

const compose = (...funcs: AppTemplateRenderer[]) =>
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

        const renderers = getPlugins<AppTemplateRendererPlugin>("app-template-renderer").map(
            pl => pl.render
        );
        return () => compose(...renderers)(<Routes />);
    };
}
