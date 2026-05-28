import type { Plugin } from "@webiny/plugins/types.js";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";

export const createBackgroundTasks = (): Plugin[] => {
    return [...createBackgroundTaskContext(), ...createBackgroundTaskGraphQL()];
};
