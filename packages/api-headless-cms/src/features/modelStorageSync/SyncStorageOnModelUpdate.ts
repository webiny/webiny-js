import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ModelAfterUpdateEventHandler } from "~/features/contentModel/UpdateModel/index.js";
import {
    MODEL_STORAGE_SYNC_TASK,
    ModelStorageSync,
    type IModelStorageSyncTaskInput
} from "./abstractions.js";

/**
 * After a model edited in the admin UI is saved, starts the background sync if its storage has work
 * to do. Code models are skipped: there is no event for a changed code definition, so their sync is
 * triggered after a deploy (the background tasks `triggerTask` mutation, or `TaskService`).
 *
 * Never fails the update: the model is already stored, and pending work only makes some queries
 * slower until a sync runs.
 */
class SyncStorageOnModelUpdateImpl implements ModelAfterUpdateEventHandler.Interface {
    public constructor(
        private readonly logger: Logger.Interface,
        private readonly sync?: ModelStorageSync.Interface,
        private readonly taskService?: TaskService.Interface
    ) {}

    public async handle(event: ModelAfterUpdateEventHandler.Event): Promise<void> {
        const { model } = event.payload;
        if (!this.sync || !this.taskService || model.isPlugin) {
            return;
        }
        try {
            if (!(await this.sync.needsSync(model))) {
                return;
            }
            await this.taskService.trigger<IModelStorageSyncTaskInput>({
                definition: MODEL_STORAGE_SYNC_TASK,
                name: `Sync storage of model "${model.modelId}"`,
                input: { modelId: model.modelId }
            });
        } catch (error) {
            this.logger.error(
                { error, modelId: model.modelId },
                "Could not start the storage sync of a changed model."
            );
        }
    }
}

export const SyncStorageOnModelUpdate = ModelAfterUpdateEventHandler.createImplementation({
    implementation: SyncStorageOnModelUpdateImpl,
    dependencies: [
        Logger,
        [ModelStorageSync, { optional: true }],
        [TaskService, { optional: true }]
    ]
});
