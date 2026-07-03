import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "./context.js";
import { createBackgroundTaskGraphQL } from "./graphql/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";
import { TaskServiceTransport } from "./plugins/index.js";
import { StepFunctionServicePlugin } from "./service/StepFunctionServicePlugin.js";
import { EventBridgeEventTransportPlugin } from "./service/EventBridgeEventTransportPlugin.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container: Container) {
        // Register models at register() time so they are available to GetModelUseCase when the
        // ModelsFetcher cache is first filled (which may happen during an earlier feature's enhance).
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);

        // Task-service transports as DI instances (was createServicePlugins() dumped into ctx.plugins
        // and read via context.plugins.byType in createService).
        container.registerInstance(
            TaskServiceTransport,
            new StepFunctionServicePlugin({ default: true })
        );
        container.registerInstance(TaskServiceTransport, new EventBridgeEventTransportPlugin());

        registerLegacyPluginsViaGqlContextualSchema(container, [
            ...createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL()
        ]);
    }
});
