import { Context } from "~/types";
import { ITaskService, TaskServicePlugin } from "~/plugins";
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
    const getLocale = (): string => {
        return params.context.cms.getLocale().code;
    };

    return plugin.createService({
        context: params.context,
        getTenant,
        getLocale
    });
};
