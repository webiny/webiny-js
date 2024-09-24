import { createHandlers } from "~/handlers";
import { createDefaultGraphQL } from "~/plugins";

export * from "./abstractions";
export * from "./handlers";
export * from "./useCases";
export * from "./plugins";
export * from "./tasks";

export const createHcmsBulkActions = () => [createHandlers(), createDefaultGraphQL()];
