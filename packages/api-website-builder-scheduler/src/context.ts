import { ContextPlugin } from "@webiny/api";
import { SchedulePageActionFeature } from "~/features/SchedulePageAction/feature.js";
import { CancelScheduledPageActionFeature } from "~/features/CancelScheduledPageAction/feature.js";
import { CancelScheduledActionOnPageChangeFeature } from "~/features/CancelScheduledActionOnPageChange/feature.js";

export const createWebsiteBuilderScheduleContext = () => {
    return new ContextPlugin(async context => {
        SchedulePageActionFeature.register(context.container);
        CancelScheduledPageActionFeature.register(context.container);
        CancelScheduledActionOnPageChangeFeature.register(context.container);
    });
};
