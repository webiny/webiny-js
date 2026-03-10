import type { PluginCollection } from "@webiny/plugins/types.js";
import { createWebsiteBuilderScheduleContext } from "~/context.js";
import { createWbSchedulerGraphQL } from "~/graphql/index.js";

/**
 * This will register both API and Handler plugins for the Website Builder Scheduler.
 * API plugin will provide the GraphQL API and code for managing the scheduled WB page actions.
 */
export const createWebsiteBuilderScheduler = (): PluginCollection => {
    return [createWebsiteBuilderScheduleContext(), createWbSchedulerGraphQL()];
};
