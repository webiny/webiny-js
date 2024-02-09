import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createGraphQL } from "~/graphql";
import { createTasksContext } from "./context";
import { ITaskConfig } from "./types";
import { createTestingRunTask } from "~/tasks/testingRunTask";

export const createBackgroundTaskGraphQL = (): Plugin[] => {
    return [createGraphQL()];
};
export const createBackgroundTaskContext = (config?: ITaskConfig): Plugin[] => {
    return [createTestingRunTask(), ...createTasksContext(config)];
};

export * from "./task";
export * from "./types";
