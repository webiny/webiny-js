import { ContextPlugin } from "@webiny/api";
import { CancelScheduledActionOnEntryChangeFeature } from "~/features/CancelScheduledActionOnEntryChange/feature.js";
import { NamespaceHandler } from "~/features/NamespaceHandler/NamespaceHandler.js";
import { PublishEntryActionHandler } from "~/features/PublishActionHandler/PublishEntryActionHandler.js";
import { UnpublishEntryActionHandler } from "~/features/UnpublishActionHandler/UnpublishEntryActionHandler.js";
import { SchedulePublishEntryUseCase } from "~/features/SchedulePublishEntryUseCase/SchedulePublishEntryUseCase.js";
import { ScheduleUnpublishEntryUseCase } from "~/features/ScheduleUnpublishEntryUseCase/ScheduleUnpublishEntryUseCase.js";

export const createHeadlessCmsScheduleContext = () => {
    return new ContextPlugin(async context => {
        context.container.register(NamespaceHandler);
        context.container.register(PublishEntryActionHandler);
        context.container.register(UnpublishEntryActionHandler);
        context.container.register(SchedulePublishEntryUseCase);
        context.container.register(ScheduleUnpublishEntryUseCase);

        CancelScheduledActionOnEntryChangeFeature.register(context.container);
    });
};
