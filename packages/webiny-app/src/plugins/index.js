// @flow
import * as React from "react";

const plugins = {};

export type Plugin = Object & {
    name: string,
    type: string
};

export const addPlugin = (...args: Array<Plugin>): void => {
    args.forEach(pl => {
        plugins[pl.name] = pl;
    });
};

export const getPlugins = (type: string): Array<Plugin> => {
    const values: Array<Plugin> = (Object.values(plugins): any);
    return values.filter((plugin: Plugin) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?Plugin => {
    return plugins[name];
};

export const removePlugin = (name: string): void => {
    delete plugins[name];
};

export const renderPlugins = (
    type: string,
    params: ?Object = null,
    fn: string = "render"
): Array<React.Node> => {
    const args = params ? [params] : [];
    return getPlugins(type).map(plugin => {
        const content = plugin[fn].call(null, ...args);
        if (content) {
            return React.cloneElement(content, { key: plugin.name });
        }
        return null;
    });
};
