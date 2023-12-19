import { CreateElasticsearchIndexTaskConfig, createElasticsearchReindexingTask } from "~/tasks";
import { Plugin } from "@webiny/plugins/types";

export type CreateElasticsearchBackgroundTasksParams = CreateElasticsearchIndexTaskConfig;

export const createElasticsearchBackgroundTasks = (
    params?: CreateElasticsearchBackgroundTasksParams
): Plugin[] => {
    return [createElasticsearchReindexingTask(params)];
};
