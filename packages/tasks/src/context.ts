import { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { Context, ITaskConfig, ITasksContextConfigObject } from "~/types";
import { createTaskModel } from "./crud/model";
import { createTaskCrud } from "./crud/crud.tasks";
import { createDefinitionCrud } from "./crud/definition.tasks";
import { createTriggerTasksCrud } from "~/crud/trigger.tasks";

const createConfig = (config?: ITaskConfig): ITasksContextConfigObject => {
    return {
        config: {
            eventBusName: config?.eventBusName || String(process.env.EVENT_BUS)
        }
    };
};

export const createTasksContext = (input?: ITaskConfig): Plugin[] => {
    const config = createConfig(input);
    return [
        ...createTaskModel(),
        new ContextPlugin<Context>(async context => {
            context.tasks = {
                ...config,
                ...createDefinitionCrud(context),
                ...createTaskCrud(context),
                ...createTriggerTasksCrud(context, config.config)
            };
        })
    ];
};
