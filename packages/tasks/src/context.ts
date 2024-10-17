import { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";
import { createTaskModel } from "./crud/model";
import { createDefinitionCrud } from "./crud/definition.tasks";
import { createServiceCrud } from "~/crud/service.tasks";
import { createTaskCrud } from "./crud/crud.tasks";
import { createTestingRunTask } from "~/tasks/testingRunTask";
import { createServicePlugins } from "~/service";

const createTasksCrud = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        context.tasks = {
            ...createDefinitionCrud(context),
            ...createTaskCrud(context),
            ...createServiceCrud(context)
        };
    });

    plugin.name = "tasks.context";

    return plugin;
};

const createTasksContext = (): Plugin[] => {
    return [...createServicePlugins(), ...createTaskModel(), createTasksCrud()];
};

export const createBackgroundTaskContext = (): Plugin[] => {
    return [createTestingRunTask(), ...createTasksContext()];
};
