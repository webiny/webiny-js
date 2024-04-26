import { createTasks } from "~/tasks";
import { createHandlers } from "~/handlers";
import { createGraphQL } from "~/graphql";

export * from "./tasks/entries/useCases";

export const createHcmsTasks = () => [createTasks(), createHandlers(), createGraphQL()];
