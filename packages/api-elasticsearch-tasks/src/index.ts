import {
    createDataSynchronization,
    createElasticsearchReindexingTask,
    createEnableIndexingTask,
    createIndexesTaskDefinition
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
        createIndexesTaskDefinition(params),
        createDataSynchronization(params)
    ];
};

export * from "~/tasks/createIndexes/CreateElasticsearchIndexTaskPlugin";
