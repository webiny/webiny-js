import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { UpdateFlpUseCase } from "../UpdateFlp/abstractions.js";
import type { FolderAfterUpdateEvent } from "~/features/folder/UpdateFolder/events.js";
import type { IUpdateFlpTaskInput } from "~/types.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { FolderAfterUpdateEventHandler } from "~/features/folder/UpdateFolder/index.js";

class UpdateFlpOnFolderUpdatedHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(
        private updateFlpUseCase: UpdateFlpUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterUpdateEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            if (this.tasks) {
                await this.tasks.trigger<IUpdateFlpTaskInput>({
                    definition: UPDATE_FLP_TASK_ID,
                    input: { folder }
                });
            } else {
                await this.updateFlpUseCase.execute({ folder });
            }
        } catch {
            // Ignore errors
        }
    }
}

export const UpdateFlpOnFolderUpdatedHandler = FolderAfterUpdateEventHandler.createImplementation({
    implementation: UpdateFlpOnFolderUpdatedHandlerImpl,
    dependencies: [UpdateFlpUseCase, [TaskService, { optional: true }]]
});
