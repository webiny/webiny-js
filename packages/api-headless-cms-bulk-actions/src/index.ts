import { createTasks } from "~/tasks";
import { createHandlers } from "~/handlers";
import { createDefaultGraphQL } from "~/plugins";

export * from "./abstractions";
export * from "./useCases";
export * from "./plugins";

export const createHcmsBulkActions = () => [
    createTasks(),
    createHandlers(),
    createDefaultGraphQL()
];
