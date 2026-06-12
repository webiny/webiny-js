import { createWebsiteBuilderScheduleContext } from "~/context.js";
import { ContextPlugin } from "@webiny/api";

export const createWebsiteBuilderScheduler = (): ContextPlugin[] => {
    return [createWebsiteBuilderScheduleContext()];
};
export { WebsiteBuilderSchedulerFeature } from "./WebsiteBuilderSchedulerFeature.js";
