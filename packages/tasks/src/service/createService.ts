import type { Context } from "~/types.js";
import type { ITaskService } from "~/plugins/index.js";
import { TaskServicePlugin } from "~/plugins/index.js";
import { WebinyError } from "@webiny/error";

export interface ICreateTransport {
    context: Context;
}

export const createService = (params: ICreateTransport): ITaskService => {
    const plugins = params.context.plugins
        .byType<TaskServicePlugin>(TaskServicePlugin.type)
        .reverse();

    const plugin = plugins.find(plugin => plugin.default) || plugins[0];
    if (!plugin) {
        throw new WebinyError("Missing TaskServicePlugin.", "PLUGIN_ERROR", {
            type: TaskServicePlugin.type
        });
    }

    const getTenant = (): string => {
        return params.context.tenancy.getCurrentTenant().id;
    };

    return plugin.createService({
        getTenant
    });
};
