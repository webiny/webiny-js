import React, { ReactNode } from "react";
import warning from "warning";
import { plugins } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import imagePlugin from "./image";

export { imagePlugin };

type RenderPluginOptions<T> = {
    wrapper?: boolean;
    fn?: string;
    filter?: (value: T, index: number, array: T[]) => boolean;
    reverse?: boolean;
};

interface RenderPlugin {
    <T extends Plugin = Plugin>(name: string, params?: any, options?: RenderPluginOptions<T>):
        | ReactNode
        | ReactNode[];
}

interface RenderPlugins {
    <T extends Plugin = Plugin>(type: string, params?: any, options?: RenderPluginOptions<T>):
        | ReactNode
        | ReactNode[];
}

interface PluginComponentProps {
    name: string;
    params: Record<string, any>;
    fn: string;
}
const PluginComponent: React.FC<PluginComponentProps> = props => {
    return props.children as React.ReactElement;
};
interface PluginsComponentProps {
    type: string;
    params: Record<string, any>;
    fn: string;
}
const PluginsComponent: React.FC<PluginsComponentProps> = props => {
    return props.children as React.ReactElement;
};

export const renderPlugin: RenderPlugin = (name, params = {}, options = {}) => {
    const { wrapper = true, fn = "render" } = options;

    const plugin = plugins.byName(name);
    warning(plugin, `No such plugin "${name}"`);

    if (!plugin) {
        return null;
    }

    const content = plugin[fn](params);
    if (content) {
        return wrapper ? (
            <PluginComponent key={plugin.name} name={name} params={params} fn={fn}>
                {content}
            </PluginComponent>
        ) : (
            React.cloneElement(content, { key: plugin.name })
        );
    }
    return null;
};

export const renderPlugins: RenderPlugins = (type, params = {}, options = {}) => {
    const { wrapper = true, fn = "render", filter = v => v, reverse } = options;

    const content = plugins
        .byType(type)
        .filter(pl => {
            /**
             * TODO @ts-refactor Problem with possibility of a different subtype.
             */
            // @ts-ignore
            return filter(pl);
        })
        /**
         * We cast as string because renderPlugin checks for the plugin.name
         */
        .map(plugin => renderPlugin(plugin.name as string, params, { wrapper, fn }))
        .filter(Boolean);

    if (reverse) {
        content.reverse();
    }

    return wrapper ? (
        <PluginsComponent type={type} params={params} fn={fn}>
            {content}
        </PluginsComponent>
    ) : (
        content
    );
};

export default [imagePlugin];
