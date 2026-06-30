import type { Context } from "~/api/types.js";
import type { ITaskService } from "~/api/plugins/index.js";
import { TaskServicePlugin, TaskServiceTransport } from "~/api/plugins/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { WebinyError } from "@webiny/error";

export interface ICreateTransport {
    context: Context;
}

export const createService = (params: ICreateTransport): ITaskService => {
    // Transports are registered as DI instances (TaskServiceTransport); the last-registered default
    // wins (matching the previous `.byType(...).reverse()` + find-default behaviour).
    let plugins = params.context.container.resolveAll(TaskServiceTransport).reverse();

    // TODO(item 7, commit 2): remove this legacy fallback once all consumers register transports via
    // TaskServiceTransport instead of the ctx.plugins plugin array.
    if (plugins.length === 0 && params.context.plugins) {
        plugins = params.context.plugins
            .byType<TaskServicePlugin>(TaskServicePlugin.type)
            .reverse();
    }

    const plugin = plugins.find(plugin => plugin.default) || plugins[0];
    if (!plugin) {
        throw new WebinyError("Missing TaskServicePlugin.", "PLUGIN_ERROR", {
            type: TaskServicePlugin.type
        });
    }

    const getTenant = (): string => {
        return params.context.container.resolve(TenantContext).getTenant().id;
    };

    return plugin.createService({
        getTenant
    });
};
