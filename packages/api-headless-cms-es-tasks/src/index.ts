import { createContextPlugin } from "@webiny/api";
import {
    MockDataCreatorTaskDefinition,
    MOCK_DATA_CREATOR_TASK_ID
} from "~/tasks/MockDataCreatorTask.js";
import {
    MockDataManagerTaskDefinition,
    MOCK_DATA_MANAGER_TASK_ID
} from "~/tasks/MockDataManagerTask.js";

export { MOCK_DATA_CREATOR_TASK_ID, MOCK_DATA_MANAGER_TASK_ID };

export const createHeadlessCmsEsTasks = () => {
    return createContextPlugin(context => {
        context.container.register(MockDataCreatorTaskDefinition);
        context.container.register(MockDataManagerTaskDefinition);
    });
};
