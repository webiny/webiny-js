import {
    createElasticsearchReindexingTask,
    createEnableIndexingTask,
    createIndexesTask
} from "~/tasks";
import { Plugin } from "@webiny/plugins/types";
import { IElasticsearchTaskConfig } from "~/types";

export type CreateElasticsearchBackgroundTasksParams = IElasticsearchTaskConfig;

export const createElasticsearchBackgroundTasks = (
    params?: CreateElasticsearchBackgroundTasksParams
): Plugin[] => {
    return [
        createElasticsearchReindexingTask(params),
        createEnableIndexingTask(params),
        createIndexesTask(params)
    ];
};

export * from "~/tasks/createIndexes/CreateElasticsearchIndexTaskPlugin";
