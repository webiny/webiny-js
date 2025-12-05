import { TaskService } from "@webiny/tasks/features/TaskService/abstractions.js";
import { UpdateFlpUseCase } from "../UpdateFlp/abstractions.js";
import type { FolderAfterUpdateEvent } from "~/features/folders/UpdateFolder/events.js";
import type { IUpdateFlpTaskInput } from "~/types.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { FolderAfterUpdateHandler } from "~/features/folders/UpdateFolder/index.js";

class UpdateFlpOnFolderUpdatedHandlerImpl implements FolderAfterUpdateHandler.Interface {
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
        } catch (error) {
            // Ignore errors
        }
    }
}

export const UpdateFlpOnFolderUpdatedHandler = FolderAfterUpdateHandler.createImplementation({
    implementation: UpdateFlpOnFolderUpdatedHandlerImpl,
    dependencies: [UpdateFlpUseCase, [TaskService, { optional: true }]]
});
