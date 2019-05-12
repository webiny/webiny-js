// @flow
import { getPlugin, getPlugins } from "webiny-plugins";
import warning from "warning";
import * as React from "react";
import fileUploadPlugin from "./fileUploaderPlugin";
import imagePlugin from "./imagePlugin";

type RenderPluginOptions = {
    wrapper?: boolean,
    fn?: string,
    filter?: Function
};

const Plugin = ({ children }: { children: React.Node }) => children;
const Plugins = ({ children }: { children: React.Node }) => children;

export { fileUploadPlugin, imagePlugin };

export const renderPlugin = (
    name: string,
    params?: Object = {},
    { wrapper = true, fn = "render" }: RenderPluginOptions = {}
): React.Node | Array<React.Node> => {
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
    params?: Object = {},
    { wrapper = true, fn = "render", filter = v => v }: RenderPluginOptions = {}
): React.Node | Array<React.Node> => {
    const content = getPlugins(type)
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
