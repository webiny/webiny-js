import { ContextPlugin } from "@webiny/api";
import { CancelScheduledEntryActionFeature } from "~/features/CancelScheduledEntryAction/feature.js";
import { CancelScheduledActionOnEntryChangeFeature } from "~/features/CancelScheduledActionOnEntryChange/feature.js";
import {NamespaceHandler} from "~/features/NamespaceHandler/NamespaceHandler.js";
import {PublishEntryActionHandler} from "~/features/PublishActionHandler/PublishEntryActionHandler.js";
import {UnpublishEntryActionHandler} from "~/features/UnpublishActionHandler/UnpublishEntryActionHandler.js";

export const createHeadlessCmsScheduleContext = () => {
    return new ContextPlugin(async context => {
        context.container.register(NamespaceHandler);
        context.container.register(PublishEntryActionHandler);
        context.container.register(UnpublishEntryActionHandler);

        CancelScheduledEntryActionFeature.register(context.container);
        CancelScheduledActionOnEntryChangeFeature.register(context.container);
    });
};
