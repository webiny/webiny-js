import { createCarsMockTask } from "~/tasks/createCarsMockTask";
import { createCarsMockDataTask } from "~/tasks/createCarsMockDataTask";

export * from "./tasks/createCarsMockTask";
export * from "./tasks/createCarsMockDataTask";

export const createHeadlessCmsEsTasks = () => [createCarsMockTask(), createCarsMockDataTask()];
