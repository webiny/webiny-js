import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { createModelsPlugins, type ICreateModelsPluginsParams } from "../__cms/models.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "~/index.js";
import { registerFakeFolders } from "../__helpers/FakeFolders.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { NoopGetTask } from "../__helpers/NoopGetTask.js";
import { NoopCleanupTaskSubtree } from "../__helpers/NoopCleanupTaskSubtree.js";
import { FakeTaskService } from "../__helpers/FakeTaskService.js";
import { MailerService } from "@webiny/api-mailer";
import { SendMailFeature } from "@webiny/api-mailer/features/SendMail/feature.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { InertMailer } from "../__helpers/InertMailer.js";
import { InertWebsocketConnections } from "../__helpers/InertWebsocketConnections.js";
import { InertWebsocketsSend } from "../__helpers/InertWebsocketsSend.js";

const registerNoopFlp = createRegisterExtensionPlugin(context => {
    context.container.register(NoopFolderLevelPermissions);
});

export const createContextHandler = (
    params?: CmsTestHandlerParams & ICreateModelsPluginsParams
) => {
    const testLicence = createTestWcpLicense();

    const handler = createCmsTestHandler({
        ...params,
        legacyPlugins: [
            ...createModelsPlugins(params),
            registerNoopFlp,
            params?.legacyPlugins || []
        ],
        // Mirror the production stack (registerApiRequestStack.ts): core workflows first, then the
        // CMS integration.
        setup: container => {
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
            // The saver aborts tasks through `TaskService`; this context has no background tasks.
            container.register(FakeTaskService);
            // Single reads resolve the task read for stuck detection; no background tasks here.
            container.registerInstance(GetTaskUseCase, NoopGetTask);
            // Deleting a review cleans up its step tasks (R256); no background tasks here.
            container.registerInstance(CleanupTaskSubtreeUseCase, NoopCleanupTaskSubtree);
            // ACO is not registered; the CMS folder port reads these stand-ins.
            registerFakeFolders(container);
        },
        testProjectLicense: params?.testProjectLicense ?? testLicence
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        opensearch: createTestOpenSearchClient(),
        handler,
        /** `getContext()` is `Record<string, any>` unless typed; the tests read the CMS context. */
        context: () => handler.getContext<CmsContext>(),
        /** The main `/graphql` endpoint (the `cms` root lives there). */
        invoke: handler.invoke,
        /** The CMS endpoints (`/cms/manage` by default). */
        invokeCms: handler.invokeCms,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
