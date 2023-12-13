import { Context, ITasksContextDefinitionObject } from "~/types";
import { TaskPlugin } from "~/task";

export const createDefinitionCrud = (context: Context): ITasksContextDefinitionObject => {
    return {
        getDefinition: (id: string) => {
            const plugins = context.plugins.byType<TaskPlugin>(TaskPlugin.type);

            for (const plugin of plugins) {
                if (plugin.getTask().id === id) {
                    return plugin.getTask();
                }
            }
            return null;
        },
        listDefinitions: () => {
            return context.plugins
                .byType<TaskPlugin>(TaskPlugin.type)
                .map(plugin => plugin.getTask());
        }
    };
};
