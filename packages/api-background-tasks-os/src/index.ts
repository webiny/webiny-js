import type { PluginCollection } from "@webiny/plugins/types.js";
import {
    createBackgroundTaskGraphQL,
    createBackgroundTaskContext
} from "@webiny/background-tasks/api";
import { createElasticsearchBackgroundTasks } from "@webiny/api-elasticsearch-tasks";
import { createHeadlessCmsEsTasks } from "@webiny/api-headless-cms-es-tasks";

export const createBackgroundTasks = (): PluginCollection => {
    return [
        ...createBackgroundTaskContext(),
        ...createBackgroundTaskGraphQL(),
        ...createElasticsearchBackgroundTasks(),
        createHeadlessCmsEsTasks()
    ];
};
