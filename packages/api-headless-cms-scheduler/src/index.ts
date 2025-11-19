import type { PluginCollection } from "@webiny/plugins/types.js";
import { createHeadlessCmsScheduleContext } from "~/context.js";
import { createSchedulerGraphQL } from "~/graphql/index.js";

/**
 * This will register both API and Handler plugins for the Headless CMS Scheduler.
 * API plugin will provide the GraphQL API and code for managing the scheduled CMS actions.
 */
export const createHeadlessCmsScheduler = (): PluginCollection => {
    return [createHeadlessCmsScheduleContext(), createSchedulerGraphQL()];
};
