import { createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnEntryChangeFeature } from "~/features/CancelScheduledActionOnEntryChange/feature.js";
import { NamespaceHandler } from "~/features/NamespaceHandler/NamespaceHandler.js";
import { PublishEntryActionHandler } from "~/features/PublishActionHandler/PublishEntryActionHandler.js";
import { UnpublishEntryActionHandler } from "~/features/UnpublishActionHandler/UnpublishEntryActionHandler.js";
import { SchedulePublishEntryUseCase } from "~/features/SchedulePublishEntryUseCase/SchedulePublishEntryUseCase.js";
import { ScheduleUnpublishEntryUseCase } from "~/features/ScheduleUnpublishEntryUseCase/ScheduleUnpublishEntryUseCase.js";

export const CmsSchedulerFeature = createFeature({
    name: "CmsScheduler",
    register(container) {
        // Pure DI registration (was a request-time ContextPlugin — none of it needs ctx/post-auth).
        container.register(NamespaceHandler);
        container.register(PublishEntryActionHandler);
        container.register(UnpublishEntryActionHandler);
        container.register(SchedulePublishEntryUseCase);
        container.register(ScheduleUnpublishEntryUseCase);

        CancelScheduledActionOnEntryChangeFeature.register(container);
    }
});
