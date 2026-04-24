import { ContextPlugin } from "@webiny/api";
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

export const createWebsiteBuilderScheduleContext = () => {
    return new ContextPlugin(async context => {
        context.container.register(PageNamespaceHandler);
        context.container.register(RedirectNamespaceHandler);
        context.container.register(PublishPageActionHandler);
        context.container.register(PublishRedirectActionHandler);
        context.container.register(UnpublishPageActionHandler);
        context.container.register(UnpublishRedirectActionHandler);
        context.container.register(SchedulePublishPageUseCase);
        context.container.register(ScheduleUnpublishPageUseCase);
        context.container.register(SchedulePublishRedirectUseCase);
        context.container.register(ScheduleUnpublishRedirectUseCase);

        CancelScheduledActionOnChangeFeature.register(context.container);
    });
};
