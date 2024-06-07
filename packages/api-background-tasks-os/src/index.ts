import { Plugin } from "@webiny/plugins/types";
import { createBackgroundTaskGraphQL, createBackgroundTaskContext } from "@webiny/tasks";
import { createElasticsearchBackgroundTasks } from "@webiny/api-elasticsearch-tasks";
import { createHeadlessCmsEsTasks } from "@webiny/api-headless-cms-es-tasks";

export const createBackgroundTasks = (): Plugin[] => {
    return [
        ...createBackgroundTaskContext(),
        ...createBackgroundTaskGraphQL(),
        ...createElasticsearchBackgroundTasks(),
        ...createHeadlessCmsEsTasks()
    ];
};
