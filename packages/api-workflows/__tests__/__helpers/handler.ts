import { useContextHandler, type UseContextHandlerParams } from "@webiny/testing";
import { Context } from "~/types.js";
import { createWorkflows } from "~/index.js";
import { PluginsContainer } from "@webiny/plugins";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

export const createContextHandler = async (params: UseContextHandlerParams = {}) => {
    const plugins = new PluginsContainer(params.plugins || []);
    plugins.register(createWorkflows());
    const handler = useContextHandler<Context>({
        ...params,
        debug: params.debug === undefined ? true : params.debug,
        plugins: plugins.all()
    });
    const context = await handler.context();
    const model = await context.cms.getModel(WORKFLOW_MODEL_ID);
    return {
        handler,
        context,
        model
    };
};
