import { createMockDataManagerTask } from "~/tasks/createMockDataManagerTask";
import { createMockDataCreatorTask } from "~/tasks/createMockDataCreatorTask";

export * from "./tasks/createMockDataManagerTask";
export * from "./tasks/createMockDataCreatorTask";

export const createHeadlessCmsEsTasks = () => [
    createMockDataManagerTask(),
    createMockDataCreatorTask()
];
