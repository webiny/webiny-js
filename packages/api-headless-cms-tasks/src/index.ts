import { createTasks } from "~/tasks";
import { createGraphQL } from "~/graphql";
import { createEventHandler } from "~/event";

export * from "./useCases";

export const createHeadlessCmsTasks = () => [createTasks(), createGraphQL(), createEventHandler()];
