import { ContextPlugin } from "@webiny/api";
import { ScheduleEntryActionFeature } from "~/features/ScheduleEntryAction/feature.js";
import { CancelScheduledEntryActionFeature } from "~/features/CancelScheduledEntryAction/feature.js";
import { CancelScheduledActionOnEntryChangeFeature } from "~/features/CancelScheduledActionOnEntryChange/feature.js";

export const createHeadlessCmsScheduleContext = () => {
    return new ContextPlugin(async context => {
        ScheduleEntryActionFeature.register(context.container);
        CancelScheduledEntryActionFeature.register(context.container);
        CancelScheduledActionOnEntryChangeFeature.register(context.container);
    });
};
