import React from "react";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { AppTemplateRenderer, AppTemplateRendererPlugin } from "./types";
import { WebinyInitPlugin } from "@webiny/app/types";
import { Routes } from "./Routes";

const compose = (...funcs: AppTemplateRenderer[]) =>
    funcs.reduce(
        (a, b) => (...args) => a(b(...args)),
        arg => arg
    );

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
