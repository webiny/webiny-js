import type { Container } from "@webiny/di";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
import { Extension as LanguagesExtension } from "@webiny/languages/api/Extension.js";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { WebsiteBuilderWorkflowsFeature } from "~/index.js";
import { NoopInvalidateAssetCacheTaskDefinition } from "./NoopInvalidateAssetCacheTask.js";
import { registerNoAcoFolders } from "./NoAcoFolders.js";
import { createArticleModelPlugins } from "./cmsModel.js";
import { MailerService } from "@webiny/api-mailer";
import { SendMailFeature } from "@webiny/api-mailer/features/SendMail/feature.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { InertMailer } from "./InertMailer.js";
import { InertWebsocketConnections } from "./InertWebsocketConnections.js";
import { InertWebsocketsSend } from "./InertWebsocketsSend.js";

/**
 * Website Builder as in `api-website-builder`'s `useHandler`, plus the workflows features in the
 * production order (`registerApiRequestStack.ts`): WB workflows next to WB, then the engine and
 * the CMS workflows package, whose single handlers cover pages (R51). ACO is not registered, so a
 * no-op FLP and folder reads without folders stand in; tests replace them with the fake FLP and
 * real ACO through `legacyPlugins`. One public CMS model ("article") exists for cross-app tests.
 */
export const createContextHandler = (params: CmsTestHandlerParams = {}) => {
    const { getContext, invoke } = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createArticleModelPlugins(),
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
                container.register(NoopFolderLevelPermissions);
                registerNoAcoFolders(container);
            },
            ...[params.legacyPlugins].flat(Infinity as 1).filter(Boolean)
        ],
        setup: container => {
            BackgroundTasksFeature.register(container);
            WebsiteBuilderFeature.register(container);
            WebsiteBuilderWorkflowsFeature.register(container);
            LanguagesExtension.register(container);
            container.registerInstance(TaskService, createMockTaskService());
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
            // The review notification handlers (api-workflows) need a mailer and the websocket use
            // cases; this context has no request stack. Inert, so nothing is sent.
            container.registerInstance(MailerService, new InertMailer());
            SendMailFeature.register(container);
            container.registerInstance(
                WebsocketsListConnectionsUseCase,
                new InertWebsocketConnections()
            );
            container.registerInstance(
                WebsocketsSendToConnectionsUseCase,
                new InertWebsocketsSend()
            );
        }
    });

    return {
        context: () => getContext(),
        /** POST to `/graphql` as the handler's identity. */
        invoke
    };
};
