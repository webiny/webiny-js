import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createGraphQL } from "~/graphql";
import { createTasksContext } from "./context";
import { ITaskConfig } from "./types";

export const createBackgroundTaskGraphQL = (): Plugin[] => {
    return [createGraphQL()];
};
export const createBackgroundTaskContext = (config?: ITaskConfig): Plugin[] => {
    return createTasksContext(config);
};

export * from "./task";
export * from "./types";
