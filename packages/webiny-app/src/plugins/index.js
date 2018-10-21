// @flow
import * as React from "react";

const plugins = {};

export type PluginType = Object & {
    name: string,
    type: string
};

export const addPlugin = (...args: Array<PluginType>): void => {
    args.forEach(pl => {
        plugins[pl.name] = pl;
    });
};

export const getPlugins = (type: string): Array<PluginType> => {
    const values: Array<PluginType> = (Object.values(plugins): any);
    return values.filter((plugin: PluginType) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?PluginType => {
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