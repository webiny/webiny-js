import { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { Context, ITaskConfig, ITasksContextConfigObject } from "~/types";
import { createTaskModel } from "./crud/model";
import { createDefinitionCrud } from "./crud/definition.tasks";
import { createTriggerTasksCrud } from "~/crud/trigger.tasks";
import { createTaskCrud } from "./crud/crud.tasks";
import { createTestingRunTask } from "~/tasks/testingRunTask";

const createConfig = (config?: ITaskConfig): ITasksContextConfigObject => {
    return {
        config: {
            eventBusName: config?.eventBusName || String(process.env.EVENT_BUS)
        }
    };
};

const createTasksCrud = (input?: ITaskConfig) => {
    const config = createConfig(input);
    const plugin = new ContextPlugin<Context>(async context => {
        context.tasks = {
            ...config,
            ...createDefinitionCrud(context),
            ...createTaskCrud(context),
            ...createTriggerTasksCrud(context, config.config)
        };
    });

    plugin.name = "tasks.context";

    return plugin;
};

const createTasksContext = (input?: ITaskConfig): Plugin[] => {
    return [...createTaskModel(), createTasksCrud(input)];
};

export const createBackgroundTaskContext = (config?: ITaskConfig): Plugin[] => {
    return [createTestingRunTask(), ...createTasksContext(config)];
};
