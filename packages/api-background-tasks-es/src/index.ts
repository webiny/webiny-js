import { Plugin } from "@webiny/plugins/types";
import { createBackgroundTaskGraphQL, createBackgroundTaskContext } from "@webiny/tasks";
import { createElasticsearchBackgroundTasks } from "@webiny/api-elasticsearch-tasks";

export const createBackgroundTasks = (): Plugin[] => {
    return [
        ...createBackgroundTaskContext(),
        ...createBackgroundTaskGraphQL(),
        ...createElasticsearchBackgroundTasks()
    ];
};
