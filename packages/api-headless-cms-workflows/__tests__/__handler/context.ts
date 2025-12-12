import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { createModelsPlugins } from "../__cms/models.js";
import { PluginsContainer } from "@webiny/plugins";
import type { Context } from "~/types.js";
import { createHeadlessCmsWorkflows } from "~/index.js";
import { createWorkflows } from "@webiny/api-workflows";

export const createContextHandler = (params?: UseContextHandlerParams) => {
    const container = new PluginsContainer(params?.plugins || []);
    container.register([...createModelsPlugins(), createWorkflows(), createHeadlessCmsWorkflows()]);
    return useContextHandler<Context>({
        ...params,
        plugins: container.all()
    });
};
