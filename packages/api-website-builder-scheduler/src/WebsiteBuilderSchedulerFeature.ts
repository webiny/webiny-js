import { type Container, createFeature } from "@webiny/feature/api";
import { CancelScheduledActionOnChangeFeature } from "~/features/CancelScheduledActionOnChange/feature.js";
import { PageNamespaceHandler } from "~/features/NamespaceHandler/PageNamespaceHandler.js";
import { RedirectNamespaceHandler } from "~/features/NamespaceHandler/RedirectNamespaceHandler.js";
import { PublishPageActionHandler } from "~/features/PublishActionHandler/PublishPageActionHandler.js";
import { PublishRedirectActionHandler } from "~/features/PublishActionHandler/PublishRedirectActionHandler.js";
import { UnpublishPageActionHandler } from "~/features/UnpublishActionHandler/UnpublishPageActionHandler.js";
import { UnpublishRedirectActionHandler } from "~/features/UnpublishActionHandler/UnpublishRedirectActionHandler.js";
import { SchedulePublishPageUseCase } from "~/features/SchedulePublishPageUseCase/SchedulePublishPageUseCase.js";
import { ScheduleUnpublishPageUseCase } from "~/features/ScheduleUnpublishPageUseCase/ScheduleUnpublishPageUseCase.js";
import { SchedulePublishRedirectUseCase } from "~/features/SchedulePublishRedirectUseCase/SchedulePublishRedirectUseCase.js";
import { ScheduleUnpublishRedirectUseCase } from "~/features/ScheduleUnpublishRedirectUseCase/ScheduleUnpublishRedirectUseCase.js";

export const WebsiteBuilderSchedulerFeature = createFeature({
    name: "WebsiteBuilderScheduler",
    register(container: Container) {
        // Pure DI registration (was a request-time ContextPlugin bridged via
        // registerLegacyPluginsViaGqlContextualSchema — none of it needs ctx/post-auth).
        container.register(PageNamespaceHandler);
        container.register(RedirectNamespaceHandler);
        container.register(PublishPageActionHandler);
        container.register(PublishRedirectActionHandler);
        container.register(UnpublishPageActionHandler);
        container.register(UnpublishRedirectActionHandler);
        container.register(SchedulePublishPageUseCase);
        container.register(ScheduleUnpublishPageUseCase);
        container.register(SchedulePublishRedirectUseCase);
        container.register(ScheduleUnpublishRedirectUseCase);

        CancelScheduledActionOnChangeFeature.register(container);
    }
});
