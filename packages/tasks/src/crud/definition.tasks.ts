import { Context, ITasksContextDefinitionObject } from "~/types";
import { TaskDefinitionPlugin } from "~/task";

const getTaskDefinitionPlugins = (context: Context) => {
    return context.plugins.byType<TaskDefinitionPlugin>(TaskDefinitionPlugin.type);
};

export const createDefinitionCrud = (context: Context): ITasksContextDefinitionObject => {
    return {
        getDefinition: (id: string) => {
            const plugins = getTaskDefinitionPlugins(context);

            for (const plugin of plugins) {
                if (plugin.getTask().id === id) {
                    return plugin.getTask();
                }
            }
            return null;
        },
        listDefinitions: () => {
            return getTaskDefinitionPlugins(context).map(plugin => plugin.getTask());
        }
    };
};
