import React, { ReactNode, FunctionComponentElement } from "react";
import warning from "warning";
import { getPlugin, getPlugins } from "@webiny/plugins";
import fileUploadPlugin from "./fileUploaderPlugin";
import imagePlugin from "./imagePlugin";

interface RenderPluginOptions {
    wrapper?: boolean;
    fn?: string;
    filter?: Function;
}

const Plugin = (props: { [key: string]: any }): FunctionComponentElement<{}> => props.children;
const Plugins = (props: { [key: string]: any }): FunctionComponentElement<{}> => props.children;

export { fileUploadPlugin, imagePlugin };

export const renderPlugin = (
    name: string,
    params: Object = {},
    { wrapper = true, fn = "render" }: RenderPluginOptions = {}
): ReactNode | ReactNode[] => {
    const plugin = getPlugin(name);
    warning(plugin, `No such plugin "${name}"`);

    if (!plugin) {
        return null;
    }

    const content = plugin[fn](params);
    if (content) {
        return wrapper ? (
            <Plugin key={plugin.name} name={name} params={params} fn={fn}>
                {content}
            </Plugin>
        ) : (
            React.cloneElement(content, { key: plugin.name })
        );
    }
    return null;
};

export const renderPlugins = (
    type: string,
    params: Object = {},
    { wrapper = true, fn = "render", filter = v => v }: RenderPluginOptions = {}
): ReactNode | ReactNode[] => {
    const content = getPlugins(type)
        // @ts-ignore
        .filter(filter)
        .map(plugin => renderPlugin(plugin.name, params, { wrapper, fn }));

    return wrapper ? (
        <Plugins type={type} params={params} fn={fn}>
            {content}
        </Plugins>
    ) : (
        content
    );
};

export default [imagePlugin, fileUploadPlugin];
