import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Container } from "@webiny/feature/api";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { FakeTaskService } from "./FakeTaskService.js";
import { fakeGetTask } from "./FakeGetTask.js";
import { recordingCleanup } from "./RecordingCleanupTaskSubtree.js";
import { MailerService } from "@webiny/api-mailer";
import { SendMailFeature } from "@webiny/api-mailer/features/SendMail/feature.js";
import {
    WebsocketsListConnectionsUseCase,
    WebsocketsSendToConnectionsUseCase
} from "@webiny/api-websockets/exports/api.js";
import { RecordingMailer } from "./RecordingMailer.js";
import { FakeWebsocketConnections } from "./FakeWebsocketConnections.js";
import { RecordingWebsocketsSend } from "./RecordingWebsocketsSend.js";
import { TestWorkflowModelParser } from "./TestWorkflowModelParser.js";

/** The part of the request context the tests read. `getContext()` is otherwise `Record<string, any>`. */
export interface WorkflowsTestContext {
    container: Container;
}

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions. The same handler also serves
 * GraphQL on `/graphql`: `invoke`, `createQuery`, `createMutation` and `introspect`.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            // The app adapters register the model parsers; the engine tests stand in for them.
            container.register(TestWorkflowModelParser);
            // `ReviewSaver` aborts tasks through `TaskService`; the test containers have no
            // background-tasks feature. A test that needs another one registers it in `setup`.
            container.register(FakeTaskService);
            // Single review reads look at the step's task (stuck detection, R152).
            container.registerInstance(GetTaskUseCase, fakeGetTask);
            // Deleting a review cleans up the tasks of its step attempts (R256); recorded here.
            container.registerInstance(CleanupTaskSubtreeUseCase, recordingCleanup);
            // The review notification handlers (R182) depend on the mailer and the websocket use
            // cases, which the test context does not provide. Inert instances, so no test sends a
            // mail or a frame; a test's own `registerInstance` in `params.setup` wins.
            container.registerInstance(MailerService, new RecordingMailer());
            // The e-mail transport sends through `SendMailUseCase`, which calls the instance above.
            SendMailFeature.register(container);
            container.registerInstance(
                WebsocketsListConnectionsUseCase,
                new FakeWebsocketConnections()
            );
            container.registerInstance(
                WebsocketsSendToConnectionsUseCase,
                new RecordingWebsocketsSend()
            );
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext<WorkflowsTestContext>();

    return {
        handler,
        context,
        invoke: handler.invoke,
        createQuery: handler.createQuery,
        createMutation: handler.createMutation,
        introspect: handler.introspect
    };
};
