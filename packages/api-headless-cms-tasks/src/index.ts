import { createTasks } from "~/tasks";
import { createHandlers } from "~/handlers";

export * from "./tasks/entries/useCases";

export const createHcmsTasks = () => [createTasks(), createHandlers()];
