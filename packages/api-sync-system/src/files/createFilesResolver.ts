import { createHandler } from "@webiny/handler-aws/raw/index.js";
import type { CreateHandlerParams } from "@webiny/handler-aws/raw/index.js";
import type { ICreateFilesEventHandlerParams } from "./handler/eventHandler.js";
import { createEventHandlerPlugin } from "./handler/eventHandler.js";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";
import type { Plugin } from "@webiny/plugins/types.js";

export type IAllowedFilesResolverPlugins = Plugin[];

export interface ICreateFilesResolverParams
    extends Omit<CreateHandlerParams, "plugins">,
        ICreateFilesEventHandlerParams {
    plugins?: IAllowedFilesResolverPlugins[];
}

export const createFilesResolver = (params: ICreateFilesResolverParams) => {
    const plugins = new PluginsContainer(params.plugins || []);

    plugins.register(createEventHandlerPlugin(params));
    return createHandler({
        ...params,
        plugins
    });
};
