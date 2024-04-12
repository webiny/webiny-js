import { createTasks } from "~/tasks";
import { createGraphQL } from "~/graphql";
import { createHandlers } from "~/handlers";

export * from "./tasks/entries/useCases";

export const createHeadlessCmsTasks = () => [createTasks(), createGraphQL(), createHandlers()];
