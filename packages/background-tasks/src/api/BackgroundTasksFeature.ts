import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "./context.js";
import { createBackgroundTaskGraphQL } from "./graphql/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container: Container) {
        // Register models at register() time so they are available to GetModelUseCase when the
        // ModelsFetcher cache is first filled (which may happen during an earlier feature's enhance).
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);
        registerLegacyPluginsViaGqlContextEnhancer(container, [
            ...createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL()
        ]);
    }
});
