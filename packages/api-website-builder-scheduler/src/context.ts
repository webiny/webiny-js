import { ContextPlugin } from "@webiny/api";
import { CancelScheduledActionOnEntryChangeFeature } from "~/features/CancelScheduledActionOnEntryChange/feature.js";
import { PageNamespaceHandler } from "~/features/NamespaceHandler/PageNamespaceHandler.js";
import { RedirectNamespaceHandler } from "~/features/NamespaceHandler/RedirectNamespaceHandler.js";
import { PublishEntryActionHandler } from "~/features/PublishActionHandler/PublishEntryActionHandler.js";
import { UnpublishEntryActionHandler } from "~/features/UnpublishActionHandler/UnpublishEntryActionHandler.js";
import { SchedulePublishEntryUseCase } from "~/features/SchedulePublishEntryUseCase/SchedulePublishEntryUseCase.js";
import { ScheduleUnpublishEntryUseCase } from "~/features/ScheduleUnpublishEntryUseCase/ScheduleUnpublishEntryUseCase.js";

export const createWebsiteBuilderScheduleContext = () => {
    return new ContextPlugin(async context => {
        context.container.register(PageNamespaceHandler);
        context.container.register(RedirectNamespaceHandler);
        context.container.register(PublishEntryActionHandler);
        context.container.register(UnpublishEntryActionHandler);
        context.container.register(SchedulePublishEntryUseCase);
        context.container.register(ScheduleUnpublishEntryUseCase);

        CancelScheduledActionOnEntryChangeFeature.register(context.container);
    });
};
