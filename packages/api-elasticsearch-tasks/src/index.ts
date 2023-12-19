import { createElasticsearchReindexingTask } from "~/tasks";
import { Plugin } from "@webiny/plugins/types";

export const createElasticsearchBackgroundTasks = (): Plugin[] => {
    return [createElasticsearchReindexingTask()];
};
