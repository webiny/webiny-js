import React, { ReactNode, FunctionComponentElement } from "react";
import warning from "warning";
import { getPlugin, getPlugins } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import fileUploadPlugin from "./fileUploaderPlugin";
import imagePlugin from "./imagePlugin";

export { fileUploadPlugin, imagePlugin };

type RenderPluginOptions = {
    wrapper?: boolean;
    fn?: string;
    filter?: (value: Plugin, index: number, array: Plugin[]) => Plugin[];
};

type RenderPlugin = (
    name: string,
    params?: any,
    options?: RenderPluginOptions
) => ReactNode | ReactNode[];

type RenderPlugins = (
    type: string,
    params?: any,
    options?: RenderPluginOptions
) => ReactNode | ReactNode[];

const PluginComponent = (props: { [key: string]: any }): FunctionComponentElement<{}> => props.children;
const PluginsComponent = (props: { [key: string]: any }): FunctionComponentElement<{}> => props.children;

export const renderPlugin: RenderPlugin = (name, params = {}, options = {}) => {
    const { wrapper = true, fn = "render" } = options;

    const plugin = getPlugin(name);
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
    const { wrapper = true, fn = "render", filter = (v: Plugin) => v } = options;

    const content = getPlugins(type)
        .filter(filter)
        .map(plugin => renderPlugin(plugin.name, params, { wrapper, fn }));

    return wrapper ? (
        <PluginsComponent type={type} params={params} fn={fn}>
            {content}
        </PluginsComponent>
    ) : (
        content
    );
};

export default [imagePlugin, fileUploadPlugin];
